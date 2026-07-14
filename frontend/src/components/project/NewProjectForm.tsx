import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { GithubForm } from "@/components/project/GithubForm"
import { UploadForm } from "@/components/project/UploadForm"

export function NewProjectForm() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Start a new project</CardTitle>
        <CardDescription>
          Point the assistant at a GitHub repository or upload files to get
          started.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="github">
          <TabsList className="w-full">
            <TabsTrigger value="github" className="flex-1">
              GitHub
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex-1">
              Upload
            </TabsTrigger>
          </TabsList>
          <TabsContent value="github" className="pt-4">
            <GithubForm />
          </TabsContent>
          <TabsContent value="upload" className="pt-4">
            <UploadForm />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
