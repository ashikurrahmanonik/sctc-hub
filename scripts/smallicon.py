# Makes the white notification "small icon" (bell) for every screen density
from PIL import Image, ImageDraw
import os
S=192; im=Image.new('RGBA',(S,S),(0,0,0,0)); d=ImageDraw.Draw(im); W=(255,255,255,255)
d.ellipse([44,28,148,132],fill=W); d.rectangle([44,80,148,142],fill=W)
d.rounded_rectangle([28,134,164,156],radius=11,fill=W); d.ellipse([82,152,110,180],fill=W); d.rounded_rectangle([88,12,104,34],radius=7,fill=W)
for n,s in {'mdpi':24,'hdpi':36,'xhdpi':48,'xxhdpi':72,'xxxhdpi':96}.items():
    p=f'android/app/src/main/res/drawable-{n}'; os.makedirs(p,exist_ok=True)
    im.resize((s,s),Image.LANCZOS).save(p+'/ic_stat_name.png')
