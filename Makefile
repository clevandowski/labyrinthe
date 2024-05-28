run:
	docker container run -d --name "labyrinthe" -p 8080:80 --rm -v $$(pwd):/usr/share/nginx/html:ro nginx:1.26-alpine3.19

stop:
	docker container stop labyrinthe
	docker container rm labyrinthe
