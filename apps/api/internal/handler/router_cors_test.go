package handler

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestCORSMiddleware_AllowsLocalhostOriginAndEchoesRequestedHeaders(t *testing.T) {
	gin.SetMode(gin.TestMode)

	router := gin.New()
	router.Use(CORSMiddleware())
	router.GET("/ping", func(c *gin.Context) {
		c.String(http.StatusOK, "ok")
	})

	req := httptest.NewRequest(http.MethodOptions, "/ping", nil)
	req.Header.Set("Origin", "http://localhost:5173")
	req.Header.Set("Access-Control-Request-Method", http.MethodGet)
	req.Header.Set("Access-Control-Request-Headers", "authorization, content-type, x-custom")

	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusNoContent {
		t.Fatalf("expected status %d, got %d", http.StatusNoContent, rec.Code)
	}
	if got := rec.Header().Get("Access-Control-Allow-Origin"); got != "http://localhost:5173" {
		t.Fatalf("expected Access-Control-Allow-Origin to echo origin, got %q", got)
	}
	if got := rec.Header().Get("Access-Control-Allow-Headers"); got != "authorization, content-type, x-custom" {
		t.Fatalf("expected Access-Control-Allow-Headers to echo request, got %q", got)
	}
	if got := rec.Header().Get("Access-Control-Allow-Credentials"); got != "true" {
		t.Fatalf("expected Access-Control-Allow-Credentials true, got %q", got)
	}
	if got := rec.Header().Get("Vary"); got == "" {
		t.Fatalf("expected Vary to be set")
	}
}

func TestCORSMiddleware_DoesNotSetCORSHeadersForDisallowedOrigin(t *testing.T) {
	gin.SetMode(gin.TestMode)

	router := gin.New()
	router.Use(CORSMiddleware())
	router.GET("/ping", func(c *gin.Context) {
		c.String(http.StatusOK, "ok")
	})

	req := httptest.NewRequest(http.MethodGet, "/ping", nil)
	req.Header.Set("Origin", "https://evil.example")

	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d", http.StatusOK, rec.Code)
	}
	if got := rec.Header().Get("Access-Control-Allow-Origin"); got != "" {
		t.Fatalf("expected no Access-Control-Allow-Origin for disallowed origin, got %q", got)
	}
}
