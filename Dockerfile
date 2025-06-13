# DEVELOPMENT DOCKERFILE
# docker build -t httpserver .
# docker run -p 8080:8080 -it -v ${pwd}:/web_root httpserver

### build stage ###
FROM golang:1.14 AS builder
COPY . .
RUN go build \
  -ldflags "-linkmode external -extldflags -static" \
  -a server.go

### run stage ###
FROM scratch
WORKDIR '/web_root'
COPY --from=builder /go/server /server
CMD ["/server"]