#!/usr/bin/env python3
"""Figma MCP(HTTP) 를 직접 호출하는 보조 스크립트 — 세션 도구 목록에 Figma 가 안 잡힐 때 사용.
토큰은 Claude Code 가 키체인에 저장한 plugin:figma:figma OAuth 항목에서 읽고, 값은 절대 출력하지 않는다.

  python3 scripts/figma-mcp.py screenshot <fileKey> <nodeId> <out.png>
  python3 scripts/figma-mcp.py context    <fileKey> <nodeId> <out.txt>
  python3 scripts/figma-mcp.py metadata   <fileKey> <nodeId> <out.txt>
"""
import json, subprocess, sys, time, urllib.request

URL = 'https://mcp.figma.com/mcp'

def token():
    raw = subprocess.run(['security', 'find-generic-password', '-s', 'Claude Code-credentials', '-w'], capture_output=True, text=True).stdout
    entries = [v for k, v in json.loads(raw)['mcpOAuth'].items() if k.startswith('plugin:figma:figma')]
    entries.sort(key=lambda e: e.get('expiresAt', 0), reverse=True)
    for e in entries:
        if e.get('expiresAt', 0) > time.time() * 1000 or 'expiresAt' not in e:
            return e['accessToken']
    return entries[0]['accessToken']

def rpc(tok, sid, method, params, id_=1):
    body = json.dumps({'jsonrpc': '2.0', 'id': id_, 'method': method, 'params': params}).encode()
    req = urllib.request.Request(URL, data=body, method='POST', headers={
        'Authorization': f'Bearer {tok}', 'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream', 'X-Figma-Plugin-Bundle': 'figma_prod@2_2_107',
        **({'Mcp-Session-Id': sid} if sid else {}),
    })
    with urllib.request.urlopen(req, timeout=120) as r:
        sid = r.headers.get('Mcp-Session-Id', sid)
        text = r.read().decode()
    if text.lstrip().startswith('{'):
        return sid, json.loads(text)
    for line in text.splitlines():           # SSE
        if line.startswith('data:'):
            msg = json.loads(line[5:].strip())
            if msg.get('id') == id_:
                return sid, msg
    raise SystemExit('no response: ' + text[:200])

def call(tool, args):
    tok = token()
    sid, _ = rpc(tok, None, 'initialize', {'protocolVersion': '2025-03-26', 'capabilities': {}, 'clientInfo': {'name': 'figma-mcp.py', 'version': '1'}})
    try:
        rpc(tok, sid, 'notifications/initialized', {}, id_=None)
    except Exception:
        pass
    _, res = rpc(tok, sid, 'tools/call', {'name': tool, 'arguments': args}, id_=2)
    if 'error' in res:
        raise SystemExit('error: ' + json.dumps(res['error'])[:400])
    return res['result']

def main():
    cmd, file_key, node_id, out = sys.argv[1:5]
    node_id = node_id.replace('-', ':')
    if cmd == 'screenshot':
        res = call('get_screenshot', {'fileKey': file_key, 'nodeId': node_id, 'maxDimension': 2600})
        url = None
        for c in res.get('content', []):
            if c.get('type') == 'text' and 'image_url' in c.get('text', ''):
                url = json.loads(c['text'])['image_url']
        if not url:
            raise SystemExit('no image url: ' + json.dumps(res)[:300])
        subprocess.run(['curl', '-sL', '-o', out, url], check=True)   # 에셋 URL 은 리다이렉트를 따라야 함
        print('saved', out)
    else:
        tool = 'get_design_context' if cmd == 'context' else 'get_metadata'
        args = {'fileKey': file_key, 'nodeId': node_id}
        if cmd == 'context':
            args.update({'clientFrameworks': 'react', 'clientLanguages': 'javascript,css', 'excludeScreenshot': True})
        res = call(tool, args)
        text = '\n\n'.join(c.get('text', '') for c in res.get('content', []) if c.get('type') == 'text')
        open(out, 'w').write(text)
        print('saved', out, len(text), 'chars')

if __name__ == '__main__':
    main()
