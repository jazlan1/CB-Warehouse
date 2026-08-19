import os
import zipfile

def make_zip(source_dir, output_zip):
    excludes = {'node_modules', '.next', '.git', 'deploy.zip', 'deploy.tar.gz', 'prisma/generated', 'app/generated', 'coverage', '.system_generated'}
    
    if os.path.exists(output_zip):
        os.remove(output_zip)
        
    with zipfile.ZipFile(output_zip, 'w', zipfile.ZIP_DEFLATED) as zf:
        for root, dirs, files in os.walk(source_dir):
            rel_root = os.path.relpath(root, source_dir)
            
            # filter out excluded dirs
            parts = rel_root.replace('\\', '/').split('/')
            if any(part in excludes for part in parts):
                continue
            
            if rel_root != '.':
                zip_dir_path = rel_root.replace('\\', '/') + '/'
                zinfo = zipfile.ZipInfo(zip_dir_path)
                zinfo.external_attr = (0o755 << 16) | (0o040000 << 16)
                zf.writestr(zinfo, '')
            
            for file in files:
                if file in ('deploy.zip', 'deploy.tar.gz'):
                    continue
                file_path = os.path.join(root, file)
                rel_file_path = os.path.relpath(file_path, source_dir).replace('\\', '/')
                if any(part in excludes for part in rel_file_path.split('/')):
                    continue
                
                with open(file_path, 'rb') as f:
                    data = f.read()
                
                zinfo = zipfile.ZipInfo(rel_file_path)
                zinfo.external_attr = (0o644 << 16) | (0o100000 << 16)
                zf.writestr(zinfo, data)
                
    print(f"Created {output_zip} ({os.path.getsize(output_zip)} bytes) with explicit UNIX 0755/0644 attributes.")

if __name__ == '__main__':
    make_zip('.', 'deploy.zip')
