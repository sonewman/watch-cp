#!/usr/bin/env node
var gulp = require('gulp')
var concat = require('gulp-concat')
var chalk = require('chalk')
var args = process.argv.slice(2)
var startDirs, startGlobs, endDir
var fs = require('fs')
var path = require('path')
var Transform = require('stream').Transform

if (args.length === 0) {
	console.error('No paths supplied!')
	process.exit(1)
} else if (args.length === 1) {
	startDirs = [process.cwd()]
	endDir = args[1]
} else {
	endDir = args.pop()
	startDirs = args
}

startDirs = startDirs.map(function (dir) {
	return path.resolve(dir)
})

endDir = path.resolve(endDir)

startGlobs = startDirs.map(function (dir) {
	return fs.statSync(dir).isDirectory()
		? dir + "**/*"
		: dir
})

function Logger() {
	var t = new Transform({ objectMode: true })
	t._transform = function (d, e, n) {
		console.log(d.path, ">", chalk.green(path.join(endDir, removePath(d.path))))
		n(null, d)
	}
	return t
}

function removePath(full) {
	var dir = startDirs.reduce(function (prev, p) {
		return (full.indexOf(p) > -1 && p.length > prev.length)
			? p
			: prev
	}, '')
	
	var fileName = ''
	if (fs.statSync(dir).isFile()) {
		fileName = path.basename(dir)
	}
	
	return full.replace(dir, '') + fileName

}

function watch() {
	gulp.watch(startGlobs, function (change) {
		var changedPath = change.path
		var endPath = path.join(removePath(changedPath))
		gulp.src(changedPath)
			.pipe(new Logger())
			.pipe(concat(endPath))
		.pipe(gulp.dest(endDir))
	})
}

gulp.src(startGlobs)
	.pipe(new Logger())
	.pipe(gulp.dest(endDir))
	.on('finish', watch)
