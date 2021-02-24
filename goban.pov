#version 3.7;

global_settings
{
	assumed_gamma 1.0
}

#include "colors.inc"

camera
{
	angle 70
	location <0, 400, 400>
	right -x * image_width / image_height
	look_at <0, -50, 0>
}

light_source
{
	<-100000, 300000, 0>
	color White
}

#declare BoardWidth = 424.2;
#declare BoardLength = 454.5;
#declare BoardThickness = 20;
#declare XSpacing = 22;
#declare YSpacing = 23.7;
#declare LineThickness = 1;
#declare StarDiameter = 4;
#declare StoneDiameter = 22.5;
#declare StoneThickness = 8.8;

#declare TexTransform = transform
{
	translate <-400, -100, 0>
	rotate <2, 1, 0>
	scale 2
}

#declare Plank = box
{
	<-BoardWidth / 2, 0, -BoardLength / 2>, <BoardWidth / 2, BoardThickness, BoardLength / 2>
	texture
	{
		pigment { color <0.9, 0.5, 0.1> }
	}
	texture
	{
		pigment
		{
			wood
			turbulence 0.1
			scale <17, 17, 50>
			color_map
			{
				[0 color rgbt <0.3, 0.1, 0, 0.8>]
				[1 color rgbt <0.3, 0.1, 0, 1>]
			}
		}
		transform { TexTransform }
	}
	texture
	{
		pigment
		{
			wood
			turbulence 0.1
			scale <9, 9, 50>
			color_map
			{
				[0 color rgbt <0.3, 0, 0, 0.8>]
				[1 color rgbt <0.3, 0, 0, 1>]
			}
		}
		transform { TexTransform }
	}
	texture
	{
		pigment
		{
			wood
			turbulence 0.1
			scale <5, 5, 50>
			color_map
			{
				[0 color rgbt <0.3, 0.2, 0, 0.8>]
				[1 color rgbt <0.3, 0.2, 0, 1>]
			}
		}
		transform { TexTransform }
	}
	texture
	{
		pigment
		{
			wood
			turbulence 0.1
			scale <2, 2, 50>
			color_map
			{
				[0 color rgbt <0.3, 0.2, 0, 0.8>]
				[1 color rgbt <0.3, 0.2, 0, 1>]
			}
		}
		transform { TexTransform }
	}
}

#declare Engraving = union
{
	#for (X, -9, 9)
		box
		{
			<X * XSpacing, 0, -9 * YSpacing> - LineThickness / 2
			<X * XSpacing, 0, 9 * YSpacing> + LineThickness / 2
		}
	#end

	#for (Y, -9, 9)
		box
		{
			<-9 * XSpacing, 0.001, Y * YSpacing> - LineThickness / 2
			<9 * XSpacing, 0, Y * YSpacing> + LineThickness / 2
		}
	#end

	#for (X, -1, 1)
		#for (Y, -1, 1)
			cylinder
			{
				<X * XSpacing * 6, -LineThickness / 2, Y * YSpacing * 6>
				<X * XSpacing * 6, LineThickness / 2, Y * YSpacing * 6>
				StarDiameter / 2
			}
		#end
	#end

	translate <0, BoardThickness, 0>

	pigment { color Black }
}

#declare Board = difference
{
	object { Plank }
	object { Engraving }
}

#declare Sharpness = pi * 0.315;
#declare R = 19.25;
#declare r = 1.5;

#declare PreThickness = (R - (R - r) * sin(Sharpness)) * 2;
#declare PreDiameter = (r + (R - r) * cos(Sharpness)) * 2;

#declare Stone = union
{
	intersection
	{
		sphere { <0, -(R - r) * sin(Sharpness), 0> R }
		sphere { <0, (R - r) * sin(Sharpness), 0> R }
		cylinder { <0, -100, 0> <0, 100, 0> R * cos(Sharpness) }
	}
	torus { (R - r) * cos(Sharpness), r }
	scale <StoneDiameter / PreDiameter, StoneThickness / PreThickness, StoneDiameter / PreDiameter>
	translate <0, BoardThickness + StoneThickness / 2, 0>
}

#declare B = texture
{
	pigment { color rgb 0.03 }
	finish { specular 0.1 roughness 0.05 }
}

#declare W =
texture { pigment { color rgb <0.95, 0.9, 0.7> } }
texture
{
	pigment
	{
		bozo
		scale <0.5, 100, 100>
		scale 1/1000
		warp { turbulence 0.1 }
		scale 1000
		color_map
		{
			[0.4, rgbt <0, 0, 0.2, 1>]
			[1, rgbt <0, 0, 0.2, 0.9>]
		}
	}
	finish { specular 0.5 roughness 0.001 reflection 0.1 }
}

#include "stones.inc"

Board

#for (X, 0, 18)
	#for (Y, 0, 18)
		#ifdef (Stones[frame_number][X][Y])
			object
			{
				Stone
				translate <(X - 9) * XSpacing, 0, (Y - 9) * YSpacing> + Nudges[frame_number][X][Y]
				texture
				{
					Stones[frame_number][X][Y]
					translate <X, 0, Y> * 100
					rotate pow(42 + X + Y * 20, 2)
				}
			}
		#end
	#end
#end