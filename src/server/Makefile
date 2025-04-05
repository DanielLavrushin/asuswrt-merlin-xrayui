BINARY_NAME=xrayui-server
OUTPUT_DIR=./../../dist/server
SRC=main.go

all: build_arm build_arm64 build_linux

build_arm:
	GOOS=linux GOARCH=arm go build -o "$(OUTPUT_DIR)/arm/$(BINARY_NAME)" $(SRC)

build_arm64:
	GOOS=linux GOARCH=arm64 go build -o "$(OUTPUT_DIR)/arm64/$(BINARY_NAME)" $(SRC)

build_linux:
	GOOS=linux GOARCH=amd64 go build -o "$(OUTPUT_DIR)/amd64/$(BINARY_NAME)" $(SRC)

clean:
	rm -f $(BINARY_NAME)_*
