"use strict";

// Change these parameters to adjust the result.
const startMove = 0;
const endMove = 1000;
const movesPerFrame = 1;
const sloppiness = 1.5;
const xSpacing = 22;
const ySpacing = 23.7;
const stoneDiameter = 22.3;
const renderer = "C:\\Program Files\\POV-Ray\\v3.7\\bin\\pvengine64";

const { spawn } = require("child_process");
const fs = require("fs");

fs.rmSync("output", { recursive: true });

const board = Array(19);

for (let x = 0; x < 19; x++)
{
	board[x] = Array(19);
}

const sgf = fs.readFileSync(process.argv[2], { encoding: "utf-8" });
const moves = sgf.toUpperCase().match(/[BW]\[\w{2}\]/g).map(m => [m.charAt(0), m.charCodeAt(2) - 65, m.charCodeAt(3) - 65]);
let scene = `#declare Stones = array[${moves.length + 1}][19][19]\n#declare Nudges = array[${moves.length + 1}][19][19]\n`;
scene += getScene(0);

for (let i = 0; i < moves.length; i++)
{
	play(...moves[i]);
	scene += getScene(i + 1);
}

fs.writeFileSync("stones.inc", scene);

let ini =
`Input_File_Name = goban.pov\n` +
`Output_File_Name = output\\\n` +
`Initial_Frame = 0\n` +
`Final_Frame = ${moves.length}\n` +
`Subset_Start_Frame = ${startMove}\n` +
`Subset_End_Frame = ${Math.min(endMove, moves.length)}\n` +
`Frame_Step = ${movesPerFrame}\n`;

fs.writeFileSync("goban.ini", ini);

fs.mkdirSync("output");

spawn(renderer, ["/RENDER", "goban.ini"]);

function play(c, x, y)
{
	const [nx, ny] = boxMuller(sloppiness);
	board[x][y] = { c: c, x: nx, y: ny };

	nudge(x, y);

	checkCapture(x - 1, y);
	checkCapture(x + 1, y);
	checkCapture(x, y - 1);
	checkCapture(x, y + 1);
}

function nudge(x, y)
{
	const [dx1, dy1] = getNudge(x, y, x - 1, y);
	const [dx2, dy2] = getNudge(x, y, x + 1, y);
	const [dx3, dy3] = getNudge(x, y, x, y - 1);
	const [dx4, dy4] = getNudge(x, y, x, y + 1);

	board[x][y].x += (dx1 + dx2 + dx3 + dx4) / 2;
	board[x][y].y += (dy1 + dy2 + dy3 + dy4) / 2;

	for (let ix = x - 1; ix >= 0; ix--)
	{
		chainNudge(ix, y, [[1, 0]]);
	}
	for (let ix = x + 1; ix < 19; ix++)
	{
		chainNudge(ix, y, [[-1, 0]]);
	}
	for (let iy = y - 1; iy >= 0; iy--)
	{
		chainNudge(x, iy, [[0, 1]]);
	}
	for (let iy = y + 1; iy < 19; iy++)
	{
		chainNudge(x, iy, [[0, -1]]);
	}

	for (let ix = x - 1; ix >= 0; ix--)
	{
		for (let iy = y - 1; iy >= 0; iy--)
		{
			chainNudge(ix, iy, [[1, 0], [0, 1]]);
		}
		for (let iy = y + 1; iy < 19; iy++)
		{
			chainNudge(ix, iy, [[1, 0], [0, -1]]);
		}
	}
	for (let ix = x + 1; ix < 19; ix++)
	{
		for (let iy = y - 1; iy >= 0; iy--)
		{
			chainNudge(ix, iy, [[-1, 0], [0, 1]]);
		}
		for (let iy = y + 1; iy < 19; iy++)
		{
			chainNudge(ix, iy, [[-1, 0], [0, -1]]);
		}
	}
}

function chainNudge(x, y, dirs)
{
	if (board[x][y] === undefined)
		return;

	let collided;

	do
	{
		collided = false;
		for (const [dirX, dirY] of dirs)
		{
			const [dx, dy] = getNudge(x, y, x + dirX, y + dirY);
			
			if (dx === 0 && dy === 0)
				continue;

			collided = true;
			board[x][y].x += dx;
			board[x][y].y += dy;
		}
	}
	while (collided);
}

function getNudge(x1, y1, x2, y2)
{
	if (x2 >= 0 && x2 < 19 && y2 >= 0 && y2 < 19 && board[x2][y2])
	{
		const dx = board[x1][y1].x - board[x2][y2].x + (x1 - x2) * xSpacing;
		const dy = board[x1][y1].y - board[x2][y2].y + (y1 - y2) * ySpacing;
		const r = Math.sqrt(dx ** 2 + dy ** 2);

		if (r >= stoneDiameter)
			return [0, 0];
			
		const factor = (stoneDiameter + 0.001) / r - 1;
		return [dx * factor, dy * factor];
	}
	else
	{
		return [0, 0];
	}
}

function checkCapture(x, y)
{
	if (x < 0 || x >= 19 || y < 0 || y >= 19 || board[x][y] === undefined)
		return;

	const group = new Set();

	if (checkCaptureRec(group, board[x][y].c, x, y))
	{
		for (const xy of group)
		{
			const [x, y] = xy.split(",");
			board[Number(x)][Number(y)] = undefined;
		}
	}
}

function checkCaptureRec(group, c, x, y)
{
	if (x < 0 || x >= 19 || y < 0 || y >= 19)
		return true;

	if (group.has(x + "," + y))
		return true;

	if (board[x][y] === undefined)
		return false;

	if (board[x][y].c !== c)
		return true;

	group.add(x + "," + y);

	return checkCaptureRec(group, c, x - 1, y) && checkCaptureRec(group, c, x + 1, y) && checkCaptureRec(group, c, x, y - 1) && checkCaptureRec(group, c, x, y + 1);
}

function boxMuller(stddev)
{
	const a = Math.random();
	const b = Math.random();
	const r = Math.sqrt(-2 * Math.log(a)) * stddev;
	const theta = 2 * Math.PI * b;
	return [r * Math.cos(theta), r * Math.sin(theta)];
}

function getScene(move)
{
	let scene = "";
	for (let x = 0; x < 19; x++)
	{
		for (let y = 0; y < 19; y++)
		{
			const stone = board[x][y];
			if (stone)
			{
				scene += `#declare Stones[${move}][${x}][${y}] = ${stone.c};\n#declare Nudges[${move}][${x}][${y}] = <${stone.x}, 0, ${stone.y}>;\n`;
			}
		}
	}
	return scene;
}