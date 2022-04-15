var rain, canvas, ctx, characterPool, fontSize, minimumChars, maximumChars, speedMultiplier, baseColor, baseColorRgb;
var interpolatedColorsBottom, interpolatedColorsTop, colorWay, slice, spacing, sliceCount, interval, verticalSpacing;
var schemeColor, fadeFactor, randomFadeFactor;

var diffusion = 16;

window.wallpaperPropertyListener = {
    applyUserProperties: function(properties) {
		if (properties.characterpool) {
			characterPool = [...properties.characterpool.value];
		}
		if (properties.fontsize) {
			fontSize = Number(properties.fontsize.value);
		}
		if (properties.minimumchars) {
			minimumChars = Number(properties.minimumchars.value);
		}
		if (properties.maximumchars) {
			maximumChars = Number(properties.maximumchars.value);
		}
		if (properties.speedmultiplier) {
			speedMultiplier = Number(properties.speedmultiplier.value);
		}
		if (properties.fadespeed) {
			fadeFactor = Number(properties.fadespeed.value);
		}
		if (properties.mutationfadespeed) {
			randomFadeFactor = Number(properties.mutationfadespeed.value);
		}
		if (properties.basecolor) {
			baseColor = rgbToHex(...properties.basecolor.value.split(' ').map(x => Math.round(255 * x)));
			baseColorRgb = hexToRgb(baseColor);
		}
		if (properties.schemecolor) {
			schemeColor = `rgb(${properties.schemecolor.value.split(' ').map(x => Math.round(255 * x)).join(', ')})`;
		}
		if (properties.highlightcolor) {
			highlightColor = `rgb(${properties.highlightcolor.value.split(' ').map(x => Math.round(255 * x)).join(', ')})`;
		}
		applyNewProperties();
    }
};

function check() {
	if (window.wallpaperOnVideoEnded) return;

	characterPool = [...'ｦｧｨｩｪｫｬｭｮｯｰｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ'];
	fontSize = 42;
	minimumChars = 14;
	maximumChars = 28;
	speedMultiplier = 1;
	fadeFactor = 2;
	randomFadeFactor = 2.5
	baseColor = '#007200';
	baseColorRgb = hexToRgb(baseColor);
	schemeColor = `rgb(0, 0, 0)`;
	highlightColor = `rgb(186, 186, 186)`;

	applyNewProperties();
}

function applyNewProperties() {
	interpolatedColorsBottom = interpolateColors(schemeColor, `rgb(${baseColorRgb.r}, ${baseColorRgb.g}, ${baseColorRgb.b})`, (maximumChars - 4) * 2);
	interpolatedColorsBottom.shift();
	interpolatedColorsBottom.pop();
	interpolatedColorsTop = interpolateColors(highlightColor, `rgb(${baseColorRgb.r}, ${baseColorRgb.g}, ${baseColorRgb.b})`, diffusion + 1);
	colorWay = [
		...interpolatedColorsBottom.map(x => rgbToHex(...x)),
		baseColor,
		...interpolatedColorsTop.reverse().map(x => rgbToHex(...x))
	];
	init();
}

function init() {
	canvas = document.getElementById('digital_rain');

	ctx = canvas.getContext('2d');

	recalcSize();

	rain = [...Array(sliceCount)];

	for (let i = 0; i < rain.length; i++) {
		rain[i] = {
			posX: slice * i,
			posY: 0,
			delay: 0,
			targetDelay: 0,
			speed: 0,
			cooldown: 0,
			lastRandomChange: {
				index: 0,
				state: 0
			},
			chars: []
		};
	}

	window.addEventListener('resize', recalcSize, false);

	interval ??= setInterval(draw_rain, 10);
}

function recalcSize() {
	document.body.style.backgroundColor = schemeColor;
	
	canvas.width = document.body.clientWidth;
	canvas.height = document.body.clientHeight;

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
			rainSlice.speed = randInRange(1, randInRange(verticalSpacing * 0.8, verticalSpacing));
			rainSlice.delay = randInRange(1, rainSlice.speed);
			rainSlice.targetDelay = randInRange(rainSlice.speed * 2, rainSlice.speed * randInRange(10, 14));
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
			if (randInRange(1, 2000) == 25) {
				rainSlice.lastRandomChange.index = randInRange(Math.floor(rainSlice.chars.length / 2), rainSlice.chars.length - 4);
				rainSlice.lastRandomChange.state = 0;
				rainSlice.chars[rainSlice.lastRandomChange.index] = characterPool[randInRange(0, characterPool.length - 1)];
			}

			rainSlice.delay += rainSlice.speed * speedMultiplier;
			if (getWithFactor(rainSlice.cooldown) < diffusion) rainSlice.cooldown++;
		}
		else {
			// add new chars if exists
			rainSlice.chars.shift();
			rainSlice.chars.push(characterPool[randInRange(0, characterPool.length - 1)]);

			if (rainSlice.lastRandomChange.index > 1) {
				rainSlice.lastRandomChange.index--;
			}

			rainSlice.posY += verticalSpacing;
			rainSlice.delay = 0;
			rainSlice.cooldown = 0;
		}

		// clear area for drawing new text
		ctx.clearRect(spacing + rainSlice.posX, 0, slice, canvas.height);
	
		// draw text
		for (let i = 0; i < rainSlice.chars.length; i++) {
			if (i === rainSlice.lastRandomChange.index && i > 1) {
				ctx.fillStyle = getColor(colorWay.length - 1 - Math.min(getRandWithFactor(rainSlice.lastRandomChange.state), rainSlice.chars.length - rainSlice.lastRandomChange.index));
			}
			else if (i === rainSlice.chars.length - 1) {
				ctx.fillStyle = getColor(colorWay.length - 1 - getCooldownState(rainSlice.cooldown));
			}
			else if (i === rainSlice.chars.length - 2) {
				ctx.fillStyle = getColor(colorWay.length - (diffusion / 2) - getCooldownState(rainSlice.cooldown));
			}
			else if (i === colorWay.length - 3 || i == colorWay.length - 4) {
				ctx.fillStyle = baseColor;
			}
			else {
				ctx.fillStyle = getColor(Math.floor(scale(i, 0, rainSlice.chars.length - 1, 0, colorWay.length - 1 - diffusion)));
			}
			ctx.fillText(rainSlice.chars[i], spacing + rainSlice.posX, rainSlice.posY + i * verticalSpacing, slice);
		}
		if (rainSlice.lastRandomChange.index > 1) {
			if (getRandWithFactor(rainSlice.lastRandomChange.state) < rainSlice.chars.length - rainSlice.lastRandomChange.index) {
				rainSlice.lastRandomChange.state++;
			}
			else {
				rainSlice.lastRandomChange.index = 0;
			}
		}
	};
}

function getWithFactor(cooldown) {
	return Math.floor(cooldown / fadeFactor * speedMultiplier);
}

function getRandWithFactor(rand) {
	return Math.floor(rand / randomFadeFactor * speedMultiplier);
}

function getCooldownState(cooldown) {
	return Math.min(getWithFactor(cooldown), Math.floor(cooldown / 2));
}

function getColor(index) {
	if (index < 0) index = 0;
	return window.colorWay[index];
}

function randInRange(min, max)
{
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getMiddle(color1, color2) {
	return rgbToHex(Math.floor((color1.r + color2.r) / 2), Math.floor((color1.g + color2.g) / 2), Math.floor((color1.b + color2.b) / 2))
}

// Thanks to https://stackoverflow.com/questions/10756313/javascript-jquery-map-a-range-of-numbers-to-another-range-of-numbers
function scale(number, inMin, inMax, outMin, outMax) {
    return (number - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
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
