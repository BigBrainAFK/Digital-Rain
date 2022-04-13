var rain, canvas, ctx, characterPool, fontSize, minimumChars, maximumChars, speedMultiplier, baseColor, baseColorRgb;
var interpolatedColors, colorWay, slice, spacing, sliceCount, interval, verticalSpacing;

window.wallpaperPropertyListener = {
    applyUserProperties: function(properties) {
		characterPool = properties.characterPool?.value ?? "ｦｧｨｩｪｫｬｭｮｯｰｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ";
		characterPool = [...characterPool];
		fontSize = properties.fontSize?.value ?? 16;
		minimumChars = properties.minimumChars?.value ?? 10;
		maximumChars = properties.maximumChars?.value ?? 25;
		speedMultiplier = properties.speedMultiplier?.value ?? 1;
		baseColor = properties.baseColor ? rgbToHex(...properties.baseColor.value.split(' ')) : '#007200';
		baseColorRgb = hexToRgb(baseColor);
		interpolatedColors = interpolateColors("rgb(0, 0, 0)", `rgb(${baseColorRgb.r}, ${baseColorRgb.g}, ${baseColorRgb.b})`, 4);
		colorWay = [
			rgbToHex(...interpolatedColors[1]),
			rgbToHex(...interpolatedColors[2]),
			rgbToHex(...interpolatedColors[3]),
			baseColor,
			baseColor,
			baseColor,
			baseColor,
			getMiddle(baseColorRgb, hexToRgb('#BABABA')),
			'#BABABA'
		];
		init();
    }
};

function init() {
	canvas = document.getElementById('digital_rain');

	ctx = canvas.getContext('2d');

	recalcSize();

	console.log(sliceCount)

	rain = [...Array(sliceCount)];

	for (let i = 0; i < rain.length; i++) {
		rain[i] = {
			posX: slice * i,
			posY: 0,
			delay: 0,
			targetDelay: 0,
			speed: 0,
			cooldown: 0,
			lastRandomChange: -1,
			chars: []
		};
	}

	window.addEventListener('resize', recalcSize, false);

	interval = setInterval(draw_rain, 100);
}

function recalcSize() {
	canvas.width = document.body.clientWidth;
	canvas.height = document.body.clientHeight;

	ctx.fillStyle = '#000000';
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	ctx.font = `${fontSize}px Meiryo`;
	const measurement = ctx.measureText(characterPool[0]);

	slice = measurement.width;

	spacing = (canvas.width % slice) / 2;
	sliceCount = Math.floor((canvas.width - spacing * 2) / slice);

	verticalSpacing = (measurement.actualBoundingBoxAscent + measurement.actualBoundingBoxDescent) * 1.1;
}

function draw_rain() {
	// go through each rain slice
	for (const rainSlice of rain) {
		// if rain slice is empty or reached the bottom regenerate
		if (!rainSlice.chars.length || rainSlice.posY >= canvas.height) {
			const rainLength = randInRange(minimumChars, maximumChars);
			// set y position of slice to the top
			rainSlice.posY = -(rainLength * verticalSpacing);
			rainSlice.speed = randInRange(1, randInRange(10, 20) * speedMultiplier);
			rainSlice.delay = randInRange(1, rainSlice.speed);
			rainSlice.targetDelay = randInRange(rainSlice.speed, rainSlice.speed * randInRange(100, 150));
			rainSlice.cooldown = 0;
			rainSlice.chars = [];
			
			// fill in random letters from the pool
			do {
				rainSlice.chars.push(characterPool[randInRange(0, characterPool.length - 1)]);
			} while(rainSlice.chars.length < rainLength);
		}

		// rain movement check
		if (rainSlice.delay <= rainSlice.targetDelay) {
			// randomly change a character for the matrix feel
			if (randInRange(1,1e5) == 25) {
				rainSlice.lastRandomChange = randInRange(0, rainSlice.chars.length - 1);
				rainSlice.chars[rainSlice.lastRandomChange] = characterPool[randInRange(0, characterPool.length - 1)];
			}

			rainSlice.delay += rainSlice.speed;
			if (rainSlice.cooldown < 2) rainSlice.cooldown++;
		}
		else {
			// add new chars if exists
			rainSlice.chars.shift();
			rainSlice.chars.push(characterPool[randInRange(0, characterPool.length - 1)]);

			rainSlice.posY += verticalSpacing;
			rainSlice.delay = 0;
			rainSlice.cooldown = 0;
		}

		// clear area for drawing new text
		ctx.fillStyle = '#000000';
		ctx.fillRect(spacing + rainSlice.posX, 0, slice, canvas.height);
	
		// draw text
		for (let i = 0; i < rainSlice.chars.length; i++) {
			switch (i) {
				case rainSlice.lastRandomChange:
				case rainSlice.chars.length - 1:
					ctx.fillStyle = colorWay[colorWay.length - 1 - rainSlice.cooldown];
					break;
				case rainSlice.chars.length - 2:
					ctx.fillStyle = colorWay[colorWay.length - 2 - rainSlice.cooldown];
					break;
				case 0:
				case 1:
				case 2:
					ctx.fillStyle = colorWay[i - 1];
					break;
				default:
					ctx.fillStyle = colorWay[colorWay.length - 3];
					break;
			}
			ctx.fillText(rainSlice.chars[i], spacing + rainSlice.posX, rainSlice.posY + i * verticalSpacing, slice);
		}
		rainSlice.lastRandomChange = -1;
	};
}

function randInRange(min, max)
{
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getMiddle(color1, color2) {
	return rgbToHex(Math.floor((color1.r + color2.r) / 2), Math.floor((color1.g + color2.g) / 2), Math.floor((color1.b + color2.b) / 2))
}


// Thanks to https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
function componentToHex(c) {
	const hex = c.toString(16);
	return hex.length == 1 ? "0" + hex : hex;
}
  
function rgbToHex(r, g, b) {
	return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function hexToRgb(hex) {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result ? {
		r: parseInt(result[1], 16),
		g: parseInt(result[2], 16),
		b: parseInt(result[3], 16)
	} : null;
}

// Thanks to https://graphicdesign.stackexchange.com/questions/83866/generating-a-series-of-colors-between-two-colors
function interpolateColor(color1, color2, factor) {
    if (arguments.length < 3) { 
        factor = 0.5; 
    }
    var result = color1.slice();
    for (var i = 0; i < 3; i++) {
        result[i] = Math.round(result[i] + factor * (color2[i] - color1[i]));
    }
    return result;
};

function interpolateColors(color1, color2, steps) {
    var stepFactor = 1 / (steps - 1),
        interpolatedColorArray = [];

    color1 = color1.match(/\d+/g).map(Number);
    color2 = color2.match(/\d+/g).map(Number);

    for(var i = 0; i < steps; i++) {
        interpolatedColorArray.push(interpolateColor(color1, color2, stepFactor * i));
    }

    return interpolatedColorArray;
}
