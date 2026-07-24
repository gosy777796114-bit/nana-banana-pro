import webview
import os
import sys
import threading
import http.server
import socketserver
import urllib.request
import base64
import json

PORT = 8123
APP_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(APP_DIR, 'app_data.json')


class Api:
    # ── تنزيل الصور ────────────────────────────────────────────────
    def download_image(self, url, filename):
        try:
            result = webview.windows[0].create_file_dialog(
                webview.SAVE_DIALOG,
                directory=os.path.expanduser('~\\Downloads'),
                save_filename=filename
            )
            if result and len(result) > 0:
                save_path = result[0]
                if url.startswith('data:'):
                    _, data = url.split(',', 1)
                    with open(save_path, 'wb') as f:
                        f.write(base64.b64decode(data))
                else:
                    urllib.request.urlretrieve(url, save_path)
                return {'ok': True, 'path': save_path}
        except Exception as e:
            print('Download error:', e)
        return {'ok': False}

    # ── حفظ البيانات (البرومبتات وغيرها) ──────────────────────────
    def save_data(self, key, value_json):
        try:
            data = {}
            if os.path.exists(DATA_FILE):
                with open(DATA_FILE, 'r', encoding='utf-8') as f:
                    data = json.load(f)
            data[key] = json.loads(value_json)
            with open(DATA_FILE, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            return True
        except Exception as e:
            print('Save error:', e)
            return False

    # ── تحميل البيانات ─────────────────────────────────────────────
    def load_data(self, key):
        try:
            if os.path.exists(DATA_FILE):
                with open(DATA_FILE, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                if key in data:
                    return json.dumps(data[key], ensure_ascii=False)
        except Exception as e:
            print('Load error:', e)
        return 'null'


def start_server(dist_dir):
    os.chdir(dist_dir)
    Handler = http.server.SimpleHTTPRequestHandler
    Handler.log_message = lambda self, fmt, *args: None
    with socketserver.TCPServer(('', PORT), Handler) as httpd:
        httpd.serve_forever()


def main():
    dist_dir = os.path.join(APP_DIR, 'dist')
    index_html = os.path.join(dist_dir, 'index.html')

    if not os.path.exists(index_html):
        print('خطأ: لم يتم العثور على ملفات التطبيق (dist/index.html).')
        sys.exit(1)

    # تشغيل سيرفر الويب المحلي
    server_thread = threading.Thread(target=start_server, args=(dist_dir,), daemon=True)
    server_thread.start()

    # تحديد مسار الأيقونة
    icon_path = os.path.join(APP_DIR, 'icon.ico')
    icon_arg = icon_path if os.path.exists(icon_path) else None

    api = Api()
    webview.create_window(
        title='تطبيق نانه وبنانه برو',
        url=f'http://localhost:{PORT}',
        js_api=api,
        width=1280,
        height=800,
        resizable=True,
        min_size=(800, 600),
    )

    webview.start(icon=icon_arg)


if __name__ == '__main__':
    main()
