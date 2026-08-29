# Celery Message Protocol — raw extract

Group: `celery-bullmq` (RFC-5 source aggregation). Faithful extract, no analysis.

## Sources

| # | URL | Fetch date | Note |
|---|-----|-----------|------|
| C1 | https://docs.celeryq.dev/en/stable/internals/protocol.html | 2026-08-20 | Rendered "Message Protocol" page (fetched; content summarized by fetch tool) |
| C2 | https://raw.githubusercontent.com/celery/celery/main/docs/internals/protocol.rst | 2026-08-20 | **Canonical reStructuredText source of C1** — all quotes below are verbatim from this file |
| C3 | https://raw.githubusercontent.com/celery/celery/main/celery/states.py | 2026-08-20 | Built-in task state vocabulary + precedence |

---

## C2 — `docs/internals/protocol.rst` (verbatim)

### Task messages — Version 2 — Definition

```python
properties = {
    'correlation_id': uuid task_id,
    'content_type': string mimetype,
    'content_encoding': string encoding,

    # optional
    'reply_to': string queue_or_url,
}
headers = {
    'lang': string 'py'
    'task': string task,
    'id': uuid task_id,
    'root_id': uuid root_id,
    'parent_id': uuid parent_id,
    'group': uuid group_id,

    # optional
    'meth': string method_name,
    'shadow': string alias_name,
    'eta': iso8601 ETA,
    'expires': iso8601 expires,
    'retries': int retries,
    'timelimit': (soft, hard),
    'argsrepr': str repr(args),
    'kwargsrepr': str repr(kwargs),
    'origin': str nodename,
    'replaced_task_nesting': int,
    'compression': string compression_method (optional; omitted when no compression is used, matches kombu compressor names such as 'zlib', 'bzip2', 'gzip'),
}

body = (
    object[] args,
    Mapping kwargs,
    Mapping embed {
        'callbacks': Signature[] callbacks,
        'errbacks': Signature[] errbacks,
        'chain': Signature[] chain,
        'chord': Signature chord_callback,
    }
)
```

### Version 2 — Example

> "This example sends a task message using version 2 of the protocol:"

```python
# chain: add(add(add(2, 2), 4), 8) == 2 + 2 + 4 + 8

import json
import os
import socket

task_id = uuid()
args = (2, 2)
kwargs = {}
basic_publish(
    message=json.dumps((args, kwargs, None)),
    application_headers={
        'lang': 'py',
        'task': 'proj.tasks.add',
        'argsrepr': repr(args),
        'kwargsrepr': repr(kwargs),
        'origin': '@'.join([os.getpid(), socket.gethostname()])
    }
    properties={
        'correlation_id': task_id,
        'content_type': 'application/json',
        'content_encoding': 'utf-8',
    }
)
```

(Note: the body is the 3-tuple `(args, kwargs, embed)` JSON-serialized; in the example `embed` is `None`.)

### Version 2 — "Changes from version 1" (verbatim list)

- "Protocol version detected by the presence of a ``task`` message header."

- "Support for multiple languages via the ``lang`` header."

    "Worker may redirect the message to a worker that supports the language."

- "Meta-data moved to headers."

    "This means that workers/intermediates can inspect the message and make decisions based on the headers without decoding the payload (that may be language specific, for example serialized by the Python specific pickle serializer)."

- "Always UTC"

    "There's no ``utc`` flag anymore, so any time information missing timezone will be expected to be in UTC time."

- "Body is only for language specific data."

    - "Python stores args/kwargs and embedded signatures in body."
    - "If a message uses raw encoding then the raw data will be passed as a single argument to the function."
    - "Java/C, etc. can use a Thrift/protobuf document as the body"

- "``origin`` is the name of the node sending the task."

- "Dispatches to actor based on ``task``, ``meth`` headers"

    "``meth`` is unused by Python, but may be used in the future to specify class+method pairs."

- "Chain gains a dedicated field."

    "Reducing the chain into a recursive ``callbacks`` argument causes problems when the recursion limit is exceeded."

    "This is fixed in the new message protocol by specifying a list of signatures, each task will then pop a task off the list when sending the next message:"

    ```python
    execute_task(message)
    chain = embed['chain']
    if chain:
        sig = maybe_signature(chain.pop())
        sig.apply_async(chain=chain)
    ```

- "``correlation_id`` replaces ``task_id`` field."

- "``root_id`` and ``parent_id`` fields helps keep track of work-flows."

- "``shadow`` lets you specify a different name for logs, monitors can be used for concepts like tasks that calls a function specified as argument:"

    ```python
    from celery.utils.imports import qualname

    class PickleTask(Task):

        def unpack_args(self, fun, args=()):
            return fun, args

        def apply_async(self, args, kwargs, **options):
            fun, real_args = self.unpack_args(*args)
            return super().apply_async(
                (fun, real_args, kwargs), shadow=qualname(fun), **options
            )

    @app.task(base=PickleTask)
    def call(fun, args, kwargs):
        return fun(*args, **kwargs)
    ```

### Version 1

> "In version 1 of the protocol all fields are stored in the message body: meaning workers and intermediate consumers must deserialize the payload to read the fields."

Message body fields (verbatim descriptions):

* `task` — *string* — "Name of the task. **required**"
* `id` — *string* — "Unique id of the task (UUID). **required**"
* `args` — *list* — "List of arguments. Will be an empty list if not provided."
* `kwargs` — *dictionary* — "Dictionary of keyword arguments. Will be an empty dictionary if not provided."
* `retries` — *int* — "Current number of times this task has been retried. Defaults to `0` if not specified."
* `eta` — *string* (ISO 8601) — "Estimated time of arrival. This is the date and time in ISO 8601 format. If not provided the message isn't scheduled, but will be executed asap."
* `expires` — *string* (ISO 8601) — *versionadded 2.0.2* — "Expiration date. This is the date and time in ISO 8601 format. If not provided the message will never expire. The message will be expired when the message is received and the expiration date has been exceeded."
* `taskset` — *string* — "The group this task is part of (if any)."
* `chord` — *Signature* — *versionadded 2.3* — "Signifies that this task is one of the header parts of a chord. The value of this key is the body of the cord that should be executed when all of the tasks in the header has returned."
* `utc` — *bool* — *versionadded 2.5* — "If true time uses the UTC timezone, if not the current local timezone should be used."
* `callbacks` — *<list>Signature* — *versionadded 3.0* — "A list of signatures to call if the task exited successfully."
* `errbacks` — *<list>Signature* — *versionadded 3.0* — "A list of signatures to call if an error occurs while executing the task."
* `timelimit` — *<tuple>(float, float)* — *versionadded 3.1* — "Task execution time limit settings. This is a tuple of hard and soft time limit value (`int`/`float` or :const:`None` for no limit)."

    "Example value specifying a soft time limit of 3 seconds, and a hard time limit of 10 seconds::"

    ```python
    {'timelimit': (3.0, 10.0)}
    ```

Version 1 example message ("an example invocation of a `celery.task.ping` task in json format"):

```javascript
{"id": "4cc7438e-afd4-4f8f-a2f3-f46567e7ca77",
 "task": "celery.task.PingTask",
 "args": [],
 "kwargs": {},
 "retries": 0,
 "eta": "2009-11-17T12:30:56.527191"}
```

### Task Serialization

> "Several types of serialization formats are supported using the `content_type` message header."
> "The MIME-types supported by default are shown in the following table."

| Scheme | MIME Type |
|---|---|
| json | application/json |
| yaml | application/x-yaml |
| pickle | application/x-python-serialize |
| msgpack | application/x-msgpack |

### Event Messages

> "Event messages are always JSON serialized and can contain arbitrary message body fields."
> "Since version 4.0. the body can consist of either a single mapping (one event), or a list of mappings (multiple events)."
> "There are also standard fields that must always be present in an event message:"

Standard body fields (verbatim):

- *string* `type` — "The type of event. This is a string containing the *category* and *action* separated by a dash delimiter (e.g., ``task-succeeded``)."
- *string* `hostname` — "The fully qualified hostname of where the event occurred at."
- *unsigned long long* `clock` — "The logical clock value for this event (Lamport time-stamp)."
- *float* `timestamp` — "The UNIX time-stamp corresponding to the time of when the event occurred."
- *signed short* `utcoffset` — "This field describes the timezone of the originating host, and is specified as the number of hours ahead of/behind UTC (e.g., -2 or +1)."
- *unsigned long long* `pid` — "The process id of the process the event originated in."

Example message ("the message fields for a ``task-succeeded`` event"):

```python
properties = {
    'routing_key': 'task.succeeded',
    'exchange': 'celeryev',
    'content_type': 'application/json',
    'content_encoding': 'utf-8',
    'delivery_mode': 1,
}
headers = {
    'hostname': 'worker1@george.vandelay.com',
}
body = {
    'type': 'task-succeeded',
    'hostname': 'worker1@george.vandelay.com',
    'pid': 6335,
    'clock': 393912923921,
    'timestamp': 1401717709.101747,
    'utcoffset': -1,
    'uuid': '9011d855-fdd1-4f8f-adb3-a413b499eafb',
    'retval': '4',
    'runtime': 0.0003212,
)
```

(The trailing `)` instead of `}` is present in the upstream source as written.)

---

## C3 — `celery/states.py` (state vocabulary, verbatim)

Module docstring defines the state sets:

- `READY_STATES` — "Set of states meaning the task result is ready (has been executed)."
- `UNREADY_STATES` — "Set of states meaning the task result is not ready (hasn't been executed)."
- `EXCEPTION_STATES` — "Set of states meaning the task returned an exception."
- `PROPAGATE_STATES` — "Set of exception states that should propagate exceptions to the user."
- `ALL_STATES` — "Set of all possible states."

```python
__all__ = (
    'PENDING', 'RECEIVED', 'STARTED', 'SUCCESS', 'FAILURE',
    'REVOKED', 'RETRY', 'IGNORED', 'READY_STATES', 'UNREADY_STATES',
    'EXCEPTION_STATES', 'PROPAGATE_STATES', 'precedence', 'state',
)
```

State precedence:

```python
#: State precedence.
#: None represents the precedence of an unknown state.
#: Lower index means higher precedence.
PRECEDENCE = [
    'SUCCESS',
    'FAILURE',
    None,
    'REVOKED',
    'STARTED',
    'RECEIVED',
    'REJECTED',
    'RETRY',
    'PENDING',
]

#: Hash lookup of PRECEDENCE to index
PRECEDENCE_LOOKUP = dict(zip(PRECEDENCE, range(0, len(PRECEDENCE))))
NONE_PRECEDENCE = PRECEDENCE_LOOKUP[None]


def precedence(state: str) -> int:
    """Get the precedence index for state.

    Lower index means higher precedence.
    """
    try:
        return PRECEDENCE_LOOKUP[state]
    except KeyError:
        return NONE_PRECEDENCE
```

`state` class docstring (verbatim):

> "Task state.
>
> State is a subclass of :class:`str`, implementing comparison methods adhering to state precedence rules::
>
>     >>> from celery.states import state, PENDING, SUCCESS
>     >>> state(PENDING) < state(SUCCESS)
>     True
>
> Any custom state is considered to be lower than :state:`FAILURE` and :state:`SUCCESS`, but higher than any of the other built-in states::
>
>     >>> state('PROGRESS') > state(STARTED)
>     True
>     >>> state('PROGRESS') > state('SUCCESS')
>     False"

Comparison operators are inverted against precedence index:

```python
def __gt__(self, other: str) -> bool:
    return precedence(self) < precedence(other)

def __ge__(self, other: str) -> bool:
    return precedence(self) <= precedence(other)

def __lt__(self, other: str) -> bool:
    return precedence(self) > precedence(other)

def __le__(self, other: str) -> bool:
    return precedence(self) >= precedence(other)
```

State constants with their inline comments (verbatim):

```python
#: Task state is unknown (assumed pending since you know the id).
PENDING = 'PENDING'
#: Task was received by a worker (only used in events).
RECEIVED = 'RECEIVED'
#: Task was started by a worker (:setting:`task_track_started`).
STARTED = 'STARTED'
#: Task succeeded
SUCCESS = 'SUCCESS'
#: Task failed
FAILURE = 'FAILURE'
#: Task was revoked.
REVOKED = 'REVOKED'
#: Task was rejected (only used in events).
REJECTED = 'REJECTED'
#: Task is waiting for retry.
RETRY = 'RETRY'
IGNORED = 'IGNORED'

READY_STATES = frozenset({SUCCESS, FAILURE, REVOKED})
UNREADY_STATES = frozenset({PENDING, RECEIVED, STARTED, REJECTED, RETRY})
EXCEPTION_STATES = frozenset({RETRY, FAILURE, REVOKED})
PROPAGATE_STATES = frozenset({FAILURE, REVOKED})

ALL_STATES = frozenset({
    PENDING, RECEIVED, STARTED, SUCCESS, FAILURE, RETRY, REVOKED,
})
```

(Note: `IGNORED` and `REJECTED` are defined constants but `ALL_STATES` as written does not include them.)
