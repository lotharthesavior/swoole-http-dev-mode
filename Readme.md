# Swoole Http Dev Mode

NodeJS worker to help development cycle while using Swoole Http server.

This worker watch from the current directory and restart when it happens to *.php files to change.

Built to be used while developing with **[laravel-swoole](https://github.com/swooletw/laravel-swoole)**.

## Dependencies

- [chokidar](https://www.npmjs.com/package/chokidar)
- [child_process](https://nodejs.org/api/child_process.html)

## Command

```bash
node SwoolerHttpDevMode.js
```

## License

The Swoole Http Dev Mode package is open-sourced software licensed under the [MIT license](http://opensource.org/licenses/MIT).