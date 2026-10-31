/** Atomic receipt transitions; every accessed key is declared for Garnet key locking. */
export const REDIS_LEASE_SCRIPT: string = `
local request = cjson.decode(ARGV[1])
local op = request.op
local expectedTypes = {'string', 'list', 'list', 'zset', 'hash', 'list', 'hash'}
for i, expected in ipairs(expectedTypes) do
  local actual = redis.call('TYPE', KEYS[i]).ok
  if actual ~= 'none' and actual ~= expected then
    return redis.error_reply('WRONGTYPE Redis lease key must be ' .. expected)
  end
end
for _, field in ipairs({'reclaimed', 'deadLettered', 'staleSettlements', 'observedOrphans'}) do
  local value = redis.call('HGET', KEYS[7], field)
  if value and not tonumber(value) then
    return redis.error_reply('Invalid Redis lease counter')
  end
end
local clock = redis.call('TIME')
local now = tonumber(clock[1]) * 1000 + math.floor(tonumber(clock[2]) / 1000)
local stored = redis.call('GET', KEYS[1])
local record = stored and cjson.decode(stored) or nil

if op == 'prune' then
  if not record then return redis.call('ZREM', KEYS[4], request.receipt) end
  return 0
end

local function stale()
  redis.call('HINCRBY', KEYS[7], 'staleSettlements', 1)
  return 0
end
local function removeClaim()
  redis.call('LREM', KEYS[3], 1, record.raw)
  local owners = redis.call('HINCRBY', KEYS[5], record.raw, -1)
  if owners <= 0 then redis.call('HDEL', KEYS[5], record.raw) end
  redis.call('ZREM', KEYS[4], request.receipt)
  redis.call('DEL', KEYS[1])
end
local function insert(destination, bytes)
  local result = redis.pcall('LPUSH', destination, bytes)
  if type(result) == 'table' and result.err then return result end
  return nil
end
local function terminal(bytes)
  local result = redis.pcall('RPUSH', KEYS[6], bytes)
  if type(result) == 'table' and result.err then return result end
  redis.call('HINCRBY', KEYS[7], 'deadLettered', 1)
  return nil
end

if op == 'flush' then
  return redis.call('LREM', KEYS[6], 1, request.bytes)
end

if op == 'claim' or op == 'observe' then
  if record then
    if op == 'claim' and record.fence == request.fence and record.deadline > now then
      return stored
    end
    return false
  end
  if op == 'claim' then
    if redis.call('LINDEX', KEYS[2], -1) ~= request.raw then return false end
  else
    if redis.call('HEXISTS', KEYS[5], request.raw) == 1 then return false end
    if not redis.call('LPOS', KEYS[3], request.raw) then return false end
  end
  local owners = redis.call('HGET', KEYS[5], request.raw)
  if owners and not tonumber(owners) then return redis.error_reply('Invalid claim owner count') end
  if request.invalid then
    local error = terminal(request.deadLetter)
    if error then return error end
    if op == 'claim' then redis.call('RPOP', KEYS[2])
    else redis.call('LREM', KEYS[3], 1, request.raw) end
    return false
  end
  record = {
    fence = request.fence, raw = request.raw, envelope = request.envelope,
    timeout = request.timeout, grace = request.grace, maxDeliveries = request.maxDeliveries,
    deadline = now + request.timeout
  }
  local encoded = cjson.encode(record)
  if op == 'claim' then
    local error = insert(KEYS[3], request.raw)
    if error then return error end
  end
  redis.call('ZADD', KEYS[4], record.deadline + record.grace, request.receipt)
  redis.call('SET', KEYS[1], encoded)
  redis.call('HINCRBY', KEYS[5], request.raw, 1)
  if op == 'claim' then redis.call('RPOP', KEYS[2])
  else redis.call('HINCRBY', KEYS[7], 'observedOrphans', 1) end
  return encoded
end

if not record or record.fence ~= request.fence then
  if op == 'reclaim' then return 0 end
  return stale()
end
if op == 'reclaim' then
  if record.deadline + record.grace >= now then return 0 end
else
  if record.deadline <= now then return stale() end
end
local owners = redis.call('HGET', KEYS[5], record.raw)
if owners and not tonumber(owners) then return redis.error_reply('Invalid claim owner count') end

if op == 'extend' then
  record.deadline = now + request.timeout
  local encoded = cjson.encode(record)
  redis.call('ZADD', KEYS[4], record.deadline + record.grace, request.receipt)
  redis.call('SET', KEYS[1], encoded)
  return 1
end
if op == 'ack' then
  removeClaim()
  return 1
end
if op == 'nack' or op == 'reclaim' then
  if request.deadLetter then
    local error = terminal(request.deadLetter)
    if error then return error end
  else
    local error = insert(KEYS[2], record.envelope)
    if error then return error end
    if op == 'reclaim' then redis.call('HINCRBY', KEYS[7], 'reclaimed', 1) end
  end
  removeClaim()
  return 1
end
return redis.error_reply('Unknown Redis lease transition')
`;
