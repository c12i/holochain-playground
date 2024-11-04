import 'babel-polyfill';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import express from 'express';
import { getPort } from 'get-port-please';
import http from 'http';
import open from 'open';
import { Server } from 'socket.io';

import { getUrls } from './urls';

export async function launchApp() {
	dotenv.config();

	const app = express();
	const server = http.createServer(app);

	const port = await getPort({ port: 8282 });
	const PORT = process.env.SERVER_PORT || port;
	const URL = `http://localhost:${PORT}`;

	app.set('port', PORT);
	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({ extended: true }));

	const publicPath = `${__dirname}/public/`;
	app.get('/', (_req, res) => {
		res.sendFile(`${publicPath}index.html`);
	});
	app.use(express.static(publicPath));

	server.listen(app.get('port'), () => {
		console.log(
			'App is running at http://localhost:%d in %s mode',
			app.get('port'),
			app.get('env'),
		);
		console.log('Press CTRL-C to stop\n');
	});

	const io = new Server(server, {
		cors: {
			origin: [URL],
		},
		maxHttpBufferSize: 1e8,
	});

	console.log('');
	console.log('Welcome to the Holochain Playground!');
	console.log('');

	// opens the url in the default browser
	open(URL);

	io.on('connection', socket => {
		setInterval(() => {
			socket.emit('urls-updated', { urls: getUrls() });
		}, 1000);
	});
}
