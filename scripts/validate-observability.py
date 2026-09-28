#!/usr/bin/env python3
"""Check provisioned Grafana dashboard references and Prometheus rules."""
import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[1]
MANIFESTS = list((ROOT / 'k8s/observability').glob('*.yml'))
documents = [doc for path in MANIFESTS for doc in yaml.safe_load_all(path.read_text()) if isinstance(doc, dict)]
configmaps = {doc['metadata']['name']: doc['data'] for doc in documents if doc.get('kind') == 'ConfigMap'}
datasources = yaml.safe_load(configmaps['grafana-datasources']['datasources.yaml'])['datasources']
uids = {source['uid'] for source in datasources}
dashboards = 0

def check_refs(node, location):
    if isinstance(node, dict):
        source = node.get('datasource')
        if isinstance(source, dict) and source.get('uid') not in uids:
            raise ValueError(f'{location}: unknown datasource UID {source.get("uid")}')
        if isinstance(node.get('datasourceUid'), str) and node['datasourceUid'] not in uids:
            raise ValueError(f'{location}: unknown datasource UID {node["datasourceUid"]}')
        for key, value in node.items():
            check_refs(value, f'{location}.{key}')
    elif isinstance(node, list):
        for index, value in enumerate(node):
            check_refs(value, f'{location}[{index}]')

for name, data in configmaps.items():
    for filename, content in data.items():
        if filename.endswith('.json'):
            dashboard = json.loads(content)
            check_refs(dashboard, f'{name}/{filename}')
            dashboards += 1

if not dashboards:
    raise ValueError('No provisioned dashboard JSON found')

rules = [(name, filename, content) for name, data in configmaps.items()
         for filename, content in data.items() if filename.endswith('-rules.yml')]
if not rules:
    raise ValueError('No Prometheus rules found')
promtool = shutil.which('promtool')
if not promtool:
    raise SystemExit('promtool is required on PATH')
with tempfile.TemporaryDirectory() as temp:
    paths = []
    for name, filename, content in rules:
        path = Path(temp) / f'{name}-{filename}'
        path.write_text(content)
        paths.append(str(path))
    subprocess.run([promtool, 'check', 'rules', *paths], check=True)

print(f'Validated {dashboards} dashboard(s), {len(uids)} datasource UID(s), {len(rules)} rule file(s)')
