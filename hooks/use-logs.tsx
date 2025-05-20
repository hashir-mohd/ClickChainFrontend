"use client"

import { useState, useEffect } from "react"

// Add more sample data to demonstrate the enhanced network graph features
const SAMPLE_LOGS = [
  {
    type: "network-request",
    data: {
      url: "https://wwapi.imhashir.me/api/v1/users/login",
      method: "OPTIONS",
      headers: [
        {
          name: "Accept",
          value: "*/*",
        },
        {
          name: "Accept-Encoding",
          value: "gzip, deflate, br, zstd",
        },
        {
          name: "Accept-Language",
          value: "en-GB,en-US;q=0.9,en;q=0.8",
        },
        {
          name: "Access-Control-Request-Headers",
          value: "content-type",
        },
        {
          name: "Access-Control-Request-Method",
          value: "POST",
        },
        {
          name: "Cache-Control",
          value: "no-cache",
        },
        {
          name: "Connection",
          value: "keep-alive",
        },
        {
          name: "Host",
          value: "wwapi.imhashir.me",
        },
        {
          name: "Origin",
          value: "https://watchwave.imhashir.me",
        },
        {
          name: "Pragma",
          value: "no-cache",
        },
        {
          name: "Referer",
          value: "https://watchwave.imhashir.me/",
        },
        {
          name: "Sec-Fetch-Dest",
          value: "empty",
        },
        {
          name: "Sec-Fetch-Mode",
          value: "cors",
        },
        {
          name: "Sec-Fetch-Site",
          value: "same-site",
        },
        {
          name: "User-Agent",
          value:
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
        },
      ],
      postData: null,
      status: 204,
      statusText: "No Content",
      mimeType: "x-unknown",
      responseHeaders: [
        {
          name: "Access-Control-Allow-Credentials",
          value: "true",
        },
        {
          name: "Access-Control-Allow-Headers",
          value: "content-type",
        },
        {
          name: "Access-Control-Allow-Methods",
          value: "GET,HEAD,PUT,PATCH,POST,DELETE",
        },
        {
          name: "Access-Control-Allow-Origin",
          value: "https://watchwave.imhashir.me",
        },
        {
          name: "Connection",
          value: "keep-alive",
        },
        {
          name: "Content-Length",
          value: "0",
        },
        {
          name: "Date",
          value: "Mon, 19 May 2025 10:06:27 GMT",
        },
        {
          name: "Server",
          value: "nginx/1.24.0 (Ubuntu)",
        },
        {
          name: "Vary",
          value: "Origin, Access-Control-Request-Headers",
        },
        {
          name: "X-Powered-By",
          value: "Express",
        },
      ],
      responseBody: null,
      time: 1007.3199996569157,
    },
    timestamp: "2025-05-19T10:06:28.122Z",
    receivedAt: "2025-05-19T10:06:28.134Z",
  },
  {
    type: "network-request",
    data: {
      url: "https://wwapi.imhashir.me/api/v1/users/login",
      method: "POST",
      headers: [
        {
          name: "Accept",
          value: "application/json, text/plain, */*",
        },
        {
          name: "Accept-Encoding",
          value: "gzip, deflate, br, zstd",
        },
        {
          name: "Accept-Language",
          value: "en-GB,en-US;q=0.9,en;q=0.8",
        },
        {
          name: "Cache-Control",
          value: "no-cache",
        },
        {
          name: "Connection",
          value: "keep-alive",
        },
        {
          name: "Content-Length",
          value: "49",
        },
        {
          name: "Content-Type",
          value: "application/json",
        },
        {
          name: "Host",
          value: "wwapi.imhashir.me",
        },
        {
          name: "Origin",
          value: "https://watchwave.imhashir.me",
        },
        {
          name: "Pragma",
          value: "no-cache",
        },
        {
          name: "Referer",
          value: "https://watchwave.imhashir.me/",
        },
        {
          name: "Sec-Fetch-Dest",
          value: "empty",
        },
        {
          name: "Sec-Fetch-Mode",
          value: "cors",
        },
        {
          name: "Sec-Fetch-Site",
          value: "same-site",
        },
        {
          name: "User-Agent",
          value:
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
        },
        {
          name: "sec-ch-ua",
          value: '"Chromium";v="136", "Google Chrome";v="136", "Not.A/Brand";v="99"',
        },
        {
          name: "sec-ch-ua-mobile",
          value: "?0",
        },
        {
          name: "sec-ch-ua-platform",
          value: '"Windows"',
        },
      ],
      postData: '{"usernameOrEmail":"asdas","password":"afadsasd"}',
      status: 404,
      statusText: "Not Found",
      mimeType: "application/json",
      responseHeaders: [
        {
          name: "Access-Control-Allow-Credentials",
          value: "true",
        },
        {
          name: "Access-Control-Allow-Origin",
          value: "https://watchwave.imhashir.me",
        },
        {
          name: "Connection",
          value: "keep-alive",
        },
        {
          name: "Content-Length",
          value: "47",
        },
        {
          name: "Content-Type",
          value: "application/json; charset=utf-8",
        },
        {
          name: "Date",
          value: "Mon, 19 May 2025 10:06:27 GMT",
        },
        {
          name: "ETag",
          value: 'W/"2f-V9ZlqXlBjSZ38IoCSay+5YdSAJI"',
        },
        {
          name: "Server",
          value: "nginx/1.24.0 (Ubuntu)",
        },
        {
          name: "Vary",
          value: "Origin",
        },
        {
          name: "X-Powered-By",
          value: "Express",
        },
      ],
      responseBody: '{"success":false,"error":"User does not exist"}',
      time: 963.7619999322296,
    },
    timestamp: "2025-05-19T10:06:28.500Z",
    receivedAt: "2025-05-19T10:06:28.514Z",
  },
  // Add some additional sample data to make the visualization more interesting
  {
    type: "click",
    data: {
      tag: "BUTTON",
      id: "loginButton",
      class: "btn btn-primary",
      text: "Login",
    },
    timestamp: "2025-05-19T10:06:26.000Z",
    receivedAt: "2025-05-19T10:06:26.010Z",
  },
  {
    type: "keydown",
    data: {
      key: "Enter",
      target: {
        tag: "INPUT",
        id: "password",
        type: "password",
      },
    },
    timestamp: "2025-05-19T10:06:27.000Z",
    receivedAt: "2025-05-19T10:06:27.010Z",
  },
  {
    type: "network-request",
    data: {
      url: "https://wwapi.imhashir.me/api/v1/movies/popular",
      method: "GET",
      headers: [
        {
          name: "Accept",
          value: "application/json, text/plain, */*",
        },
        {
          name: "Content-Type",
          value: "application/json",
        },
      ],
      postData: null,
      status: 200,
      statusText: "OK",
      mimeType: "application/json",
      responseHeaders: [
        {
          name: "Content-Type",
          value: "application/json; charset=utf-8",
        },
      ],
      responseBody: '{"success":true,"data":[{"id":1,"title":"Movie 1"},{"id":2,"title":"Movie 2"}]}',
      time: 350.45,
    },
    timestamp: "2025-05-19T10:06:29.500Z",
    receivedAt: "2025-05-19T10:06:29.514Z",
  },
  {
    type: "click",
    data: {
      tag: "DIV",
      id: "movie-1",
      class: "movie-card",
      text: "Movie 1",
    },
    timestamp: "2025-05-19T10:06:31.000Z",
    receivedAt: "2025-05-19T10:06:31.010Z",
  },
  {
    type: "network-request",
    data: {
      url: "https://wwapi.imhashir.me/api/v1/movies/1/details",
      method: "GET",
      headers: [
        {
          name: "Accept",
          value: "application/json, text/plain, */*",
        },
        {
          name: "Content-Type",
          value: "application/json",
        },
      ],
      postData: null,
      status: 200,
      statusText: "OK",
      mimeType: "application/json",
      responseHeaders: [
        {
          name: "Content-Type",
          value: "application/json; charset=utf-8",
        },
      ],
      responseBody: '{"success":true,"data":{"id":1,"title":"Movie 1","description":"A great movie","rating":4.5}}',
      time: 420.75,
    },
    timestamp: "2025-05-19T10:06:31.500Z",
    receivedAt: "2025-05-19T10:06:31.514Z",
  },
  {
    type: "error",
    data: {
      message: "Failed to load image",
      source: "https://wwapi.imhashir.me/images/movie1.jpg",
      stack: "Error: Failed to load image\n    at loadImage (/src/utils.js:42:15)",
    },
    timestamp: "2025-05-19T10:06:32.000Z",
    receivedAt: "2025-05-19T10:06:32.010Z",
  },
  {
    type: "network-request",
    data: {
      url: "https://wwapi.imhashir.me/api/v1/movies/1/similar",
      method: "GET",
      headers: [
        {
          name: "Accept",
          value: "application/json, text/plain, */*",
        },
        {
          name: "Content-Type",
          value: "application/json",
        },
      ],
      postData: null,
      status: 200,
      statusText: "OK",
      mimeType: "application/json",
      responseHeaders: [
        {
          name: "Content-Type",
          value: "application/json; charset=utf-8",
        },
      ],
      responseBody: '{"success":true,"data":[{"id":3,"title":"Similar Movie 1"},{"id":4,"title":"Similar Movie 2"}]}',
      time: 380.15,
    },
    timestamp: "2025-05-19T10:06:33.500Z",
    receivedAt: "2025-05-19T10:06:33.514Z",
  },
  {
    type: "click",
    data: {
      tag: "BUTTON",
      id: "addToWatchlist",
      class: "btn btn-secondary",
      text: "Add to Watchlist",
    },
    timestamp: "2025-05-19T10:06:35.000Z",
    receivedAt: "2025-05-19T10:06:35.010Z",
  },
  {
    type: "network-request",
    data: {
      url: "https://wwapi.imhashir.me/api/v1/users/watchlist/add",
      method: "POST",
      headers: [
        {
          name: "Accept",
          value: "application/json, text/plain, */*",
        },
        {
          name: "Content-Type",
          value: "application/json",
        },
      ],
      postData: '{"movieId":1}',
      status: 401,
      statusText: "Unauthorized",
      mimeType: "application/json",
      responseHeaders: [
        {
          name: "Content-Type",
          value: "application/json; charset=utf-8",
        },
      ],
      responseBody: '{"success":false,"error":"User not authenticated"}',
      time: 250.35,
    },
    timestamp: "2025-05-19T10:06:35.500Z",
    receivedAt: "2025-05-19T10:06:35.514Z",
  },
]

export function useLogs(isPolling = true, pollingInterval = 5000) {
  const [logs, setLogs] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Simulate loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      // Sort logs by timestamp
      const sortedLogs = [...SAMPLE_LOGS].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      )
      setLogs(sortedLogs)
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  // Simulate polling for new data
  useEffect(() => {
    if (!isPolling) return

    const interval = setInterval(() => {
      // In a real app, this would fetch new data
      // For demo purposes, we'll just keep the same data
      console.log("Polling for new data...")
    }, pollingInterval)

    return () => clearInterval(interval)
  }, [isPolling, pollingInterval])

  // Function to manually refresh data
  const mutate = () => {
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
    }, 500)
  }

  return {
    logs,
    isLoading,
    error: null,
    mutate,
  }
}
