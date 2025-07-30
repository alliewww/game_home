import cairosvg

# 把你的 SVG 檔案路徑填進來
input_svg = "example.svg"
output_png = "output.png"

# 執行轉檔
cairosvg.svg2png(url=input_svg, write_to=output_png)

print(f"轉換完成：{output_png}")
