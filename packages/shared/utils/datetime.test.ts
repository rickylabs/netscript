/**
 * Test script for datetime utilities
 *
 * Run with: deno run --unstable-temporal test-app/packages/shared/utils/datetime.test.ts
 */

import {
  hasTemporalSupport,
  nowTemporal,
  nowISO,
  nowInstant,
  formatDateTime,
  formatRelativeTime,
  timeAgo,
  parseDuration,
  formatDuration,
  toInstant,
  toZonedDateTime,
  toDuration,
  DEFAULT_TIMEZONE,
} from './datetime.ts';

console.log('='.repeat(60));
console.log('DateTime Utilities Test');
console.log('='.repeat(60));

// Test 1: Temporal Support Detection
console.log('\n--- Test 1: Temporal Support Detection ---');
console.log(`hasTemporalSupport: ${hasTemporalSupport}`);

if (hasTemporalSupport) {
  console.log('✅ Temporal API is available');
} else {
  console.log('⚠️  Temporal API is NOT available');
  console.log('   Run with: deno run --unstable-temporal <script>');
}

// Test 2: nowTemporal()
console.log('\n--- Test 2: nowTemporal() ---');
const now = nowTemporal();
console.log(`usingTemporal: ${now.usingTemporal}`);
console.log(`timezone: ${now.timezone}`);
console.log(`date: ${now.date.toISOString()}`);
if (now.zdt) {
  console.log(`zdt: ${now.zdt.toString()}`);
  console.log(`zdt.timeZoneId: ${now.zdt.timeZoneId}`);
}

// Test 3: nowTemporal with different timezone
console.log('\n--- Test 3: nowTemporal with timezone ---');
const nowNY = nowTemporal('America/New_York');
console.log(`timezone: ${nowNY.timezone}`);
console.log(`usingTemporal: ${nowNY.usingTemporal}`);
if (nowNY.zdt) {
  console.log(`zdt: ${nowNY.zdt.toString()}`);
}

// Test 4: nowISO()
console.log('\n--- Test 4: nowISO() ---');
console.log(`nowISO(): ${nowISO()}`);
console.log(`nowISO('America/Los_Angeles'): ${nowISO('America/Los_Angeles')}`);

// Test 5: nowInstant()
console.log('\n--- Test 5: nowInstant() ---');
const instant = nowInstant();
console.log(`nowInstant(): ${instant}`);
if ('epochMilliseconds' in instant) {
  console.log(`epochMilliseconds: ${instant.epochMilliseconds}`);
}

// Test 6: toInstant()
console.log('\n--- Test 6: toInstant() ---');
const testDate = new Date();
const instantFromDate = toInstant(testDate);
console.log(`toInstant(Date): ${instantFromDate}`);
const instantFromNumber = toInstant(Date.now());
console.log(`toInstant(number): ${instantFromNumber}`);
const instantFromString = toInstant('2024-01-15T12:00:00Z');
console.log(`toInstant(string): ${instantFromString}`);

// Test 7: toZonedDateTime()
console.log('\n--- Test 7: toZonedDateTime() ---');
const zdt = toZonedDateTime(testDate, 'Europe/London');
console.log(`toZonedDateTime(Date, 'Europe/London'): ${zdt}`);

// Test 8: toDuration()
console.log('\n--- Test 8: toDuration() ---');
const duration = toDuration(3661000); // 1 hour, 1 minute, 1 second
console.log(`toDuration(3661000): ${duration}`);
if (duration) {
  console.log(`  hours: ${duration.hours}`);
  console.log(`  minutes: ${duration.minutes}`);
  console.log(`  seconds: ${duration.seconds}`);
}

// Test 9: formatDateTime()
console.log('\n--- Test 9: formatDateTime() ---');
console.log(`formatDateTime(now): ${formatDateTime(new Date())}`);
console.log(`formatDateTime(now, {timezone: 'America/New_York'}): ${formatDateTime(new Date(), { timezone: 'America/New_York' })}`);
console.log(`formatDateTime(now, {use24Hour: true}): ${formatDateTime(new Date(), { use24Hour: true })}`);

// Test 10: formatRelativeTime()
console.log('\n--- Test 10: formatRelativeTime() ---');
console.log(`formatRelativeTime(0): ${formatRelativeTime(0)}`);
console.log(`formatRelativeTime(500): ${formatRelativeTime(500)}`);
console.log(`formatRelativeTime(30000): ${formatRelativeTime(30000)}`);
console.log(`formatRelativeTime(3600000): ${formatRelativeTime(3600000)}`);
console.log(`formatRelativeTime(86400000): ${formatRelativeTime(86400000)}`);
console.log(`formatRelativeTime(-60000): ${formatRelativeTime(-60000)}`);

// Test 11: timeAgo()
console.log('\n--- Test 11: timeAgo() ---');
const oneMinuteAgo = new Date(Date.now() - 60000);
const oneHourAgo = new Date(Date.now() - 3600000);
console.log(`timeAgo(1 min ago): ${timeAgo(oneMinuteAgo)}`);
console.log(`timeAgo(1 hour ago): ${timeAgo(oneHourAgo)}`);

// Test 12: parseDuration()
console.log('\n--- Test 12: parseDuration() ---');
const parsed = parseDuration(3661500);
console.log(`parseDuration(3661500):`, parsed);

// Test 13: formatDuration()
console.log('\n--- Test 13: formatDuration() ---');
console.log(`formatDuration(500): ${formatDuration(500)}`);
console.log(`formatDuration(61000): ${formatDuration(61000)}`);
console.log(`formatDuration(3661000): ${formatDuration(3661000)}`);
console.log(`formatDuration(3661000, {compact: true}): ${formatDuration(3661000, { compact: true })}`);

// Summary
console.log('\n' + '='.repeat(60));
console.log('Test Summary');
console.log('='.repeat(60));
console.log(`Temporal API Support: ${hasTemporalSupport ? '✅ YES' : '❌ NO'}`);
console.log(`usingTemporal in nowTemporal(): ${now.usingTemporal ? '✅ YES' : '❌ NO'}`);

if (!hasTemporalSupport) {
  console.log('\n⚠️  To enable Temporal API support, run with:');
  console.log('   deno run --unstable-temporal <script>');
}

console.log('\nDone!');
