from PIL import Image
import os

def convert():
    img_path = 'icon.jpg.jpg'
    if not os.path.exists(img_path):
        img_path = 'icon.jpg' # fallback
    
    img = Image.open(img_path)
    
    # Make it square by cropping center if needed
    width, height = img.size
    new_size = min(width, height)
    left = (width - new_size)/2
    top = (height - new_size)/2
    right = (width + new_size)/2
    bottom = (height + new_size)/2
    img = img.crop((left, top, right, bottom))
    
    img.save('icon.ico', format='ICO', sizes=[(256, 256)])
    print("Icon converted successfully.")

if __name__ == '__main__':
    convert()
