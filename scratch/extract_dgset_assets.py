import fitz
import os

pdf_path = r'C:\Users\91626\.gemini\antigravity-ide\brain\537a01f3-8026-4acf-9035-599bd6ee9454\.user_uploaded\media_1790065320978.pdf'
out_dir = r'C:\Projects\quotify\backend\server\assets\dgset'
os.makedirs(out_dir, exist_ok=True)

doc = fitz.open(pdf_path)
saved = 0
for page_num in range(len(doc)):
    page = doc[page_num]
    for img_index, img in enumerate(page.get_images(full=True)):
        xref = img[0]
        base_img = doc.extract_image(xref)
        img_bytes = base_img['image']
        img_ext = base_img['ext']
        w = base_img['width']
        h = base_img['height']
        out_name = f"p{page_num+1}_img{img_index+1}_{w}x{h}.{img_ext}"
        out_path = os.path.join(out_dir, out_name)
        with open(out_path, 'wb') as f:
            f.write(img_bytes)
        saved += 1
        print(f"Saved {out_name}: {len(img_bytes)} bytes, {w}x{h}")

print(f"Total extracted: {saved}")
