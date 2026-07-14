import { createBrowserRouter, Navigate } from "react-router"
import App from "@/App"
import { HomePage } from "@/routes/HomePage"
import { ProjectPage } from "@/routes/ProjectPage"

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "project/:id", element: <ProjectPage /> },
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
])
