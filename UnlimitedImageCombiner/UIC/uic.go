package UIC

import (
	"fmt"
	"io/ioutil"
	"net/http"
)

func init() {
	http.HandleFunc("/", handler)
}

func handler(w http.ResponseWriter, r *http.Request) {
	data, err := ioutil.ReadFile("UIC/index.html")
	if err != nil {
		fmt.Fprint(w, "Error")
	}
	fmt.Fprint(w, string(data))
}
