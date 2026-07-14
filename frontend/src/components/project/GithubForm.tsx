import { useState, type FormEvent } from "react"
import { Field, FieldLabel, FieldError } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useCreateProject } from "@/hooks/useCreateProject"

function isValidRepoUrl(value: string) {
  try {
    const url = new URL(value)
    return url.hostname === "github.com" && url.pathname.split("/").filter(Boolean).length >= 2
  } catch {
    return false
  }
}

export function GithubForm() {
  const { githubMutation } = useCreateProject()
  const [repoUrl, setRepoUrl] = useState("")
  const [touched, setTouched] = useState(false)

  const invalid = touched && !isValidRepoUrl(repoUrl)

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setTouched(true)
    if (!isValidRepoUrl(repoUrl)) return
    githubMutation.mutate({ repoUrl })
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <Field data-invalid={invalid}>
        <FieldLabel htmlFor="repo-url">GitHub repository URL</FieldLabel>
        <Input
          id="repo-url"
          type="url"
          placeholder="https://github.com/owner/repo"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          onBlur={() => setTouched(true)}
          aria-invalid={invalid}
          disabled={githubMutation.isPending}
        />
        {invalid && <FieldError>Enter a valid GitHub repository URL.</FieldError>}
      </Field>
      <Button type="submit" disabled={githubMutation.isPending}>
        {githubMutation.isPending && <Spinner />}
        Create project
      </Button>
    </form>
  )
}
