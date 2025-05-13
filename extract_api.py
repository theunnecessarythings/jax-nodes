import inspect
import json
import jax.numpy as jnp
import jax

# (Optional) a little helper to prettify the label
def nice_label(name: str) -> str:
    return name.replace('_', ' ').title()

# If you want custom output‑names for certain ops:
OUTPUT_NAME_OVERRIDES = {
    # 'add': 'sum',
    # 'sqrt': 'root',
    # # …etc…
}

ids = set()

def nice_id(name: str) -> str:
    # if id is already taken, append a number
    if name in ids:
        i = 1
        while f'{name}_{i}' in ids:
            i += 1
        name = f'{name}_{i}'
    ids.add(name)
    return name

def build_api_dict(module, names, category):
    api = []
    for name in names:
        func = getattr(module, name, None)
        if not inspect.isfunction(func):
            continue

        sig = inspect.signature(func)

        # inputs
        inputs = []
        for p in sig.parameters.values():
            # skip 'kwargs' if you like, or include them generically
            if p.kind in (inspect.Parameter.VAR_POSITIONAL,
                          inspect.Parameter.VAR_KEYWORD):
                continue

            # use annotation if available, else fallback
            t = p.annotation
            tname = getattr(t, '__name__', None) or 'any'
            inputs.append({
                'name': nice_label(p.name),
                'type': tname
            })

        # outputs: get return‑annotation or fallback
        ret = sig.return_annotation
        rname = getattr(ret, '__name__', None) or 'any'
        out_name = OUTPUT_NAME_OVERRIDES.get(name, 'result')
        outputs = [{'name': nice_label(out_name), 'type': rname}]

        api.append({
            'id': nice_id(name),
            'label': nice_label(name),
            'inputs': inputs,
            'outputs': outputs,
            'category': category,
        })

    return api

members = inspect.getmembers(jax)
modules = [member for member in members if inspect.ismodule(member[1])]


apis = []
for m in modules:
    api = build_api_dict(m[1], getattr(m[1], '__all__', dir(m[1])), m[0])
    apis.extend(api)

print(f'Found {len(apis)} APIs')
# dump as JSON
with open('src/nodes/jax_api.json', 'w') as f:
    json.dump(apis, f, indent=2)
