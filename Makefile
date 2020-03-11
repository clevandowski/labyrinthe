run:
	docker container run -d --name "labyrinthe" -p 8080:80 --rm -v $$(pwd):/usr/share/nginx/html:ro nginx:1.17-alpine
