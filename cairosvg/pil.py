from PIL import Image

# 1. 開啟圖片
img = Image.open('output.png')

# 2. 調整尺寸到 192x192
img_resized = img.resize((192, 192), Image.Resampling.LANCZOS)

# 3. 存成新檔案
img_resized.save('icon-192.png')

# 2. 調整尺寸到 192x192
img_resized = img.resize((512, 512), Image.Resampling.LANCZOS)

# 3. 存成新檔案
img_resized.save('icon-512.png')

print("圖片已成功縮放並存檔！")
