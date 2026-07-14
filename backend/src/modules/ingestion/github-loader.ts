import { BadRequestException } from '@nestjs/common';
import { Parser as TarParser } from 'tar';
import { LoadedFile } from './ingestion.types';

export function parseGithubUrl(repoUrl: string): {
  owner: string;
  repo: string;
  ref?: string;
} {
  let url: URL;
  try {
    url = new URL(repoUrl);
  } catch {
    throw new BadRequestException(`Invalid repository URL: ${repoUrl}`);
  }

  const segments = url.pathname.replace(/^\/+|\/+$/g, '').split('/');
  if (segments.length < 2) {
    throw new BadRequestException(`Invalid GitHub repository URL: ${repoUrl}`);
  }

  const [owner, repoRaw, treeKeyword, ...refSegments] = segments;
  const repo = repoRaw.replace(/\.git$/, '');
  const ref =
    treeKeyword === 'tree' && refSegments.length
      ? refSegments.join('/')
      : undefined;

  return { owner, repo, ref };
}

export async function loadGithubRepo(
  repoUrl: string,
  githubToken?: string,
): Promise<LoadedFile[]> {
  const { owner, repo, ref } = parseGithubUrl(repoUrl);
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/tarball${ref ? `/${ref}` : ''}`;

  const headers: Record<string, string> = {
    'User-Agent': 'code-documentation-assistant',
    Accept: 'application/vnd.github+json',
  };
  if (githubToken) {
    headers.Authorization = `Bearer ${githubToken}`;
  }

  const response = await fetch(apiUrl, { headers });
  if (!response.ok) {
    throw new BadRequestException(
      `Failed to download repository tarball (${response.status} ${response.statusText})`,
    );
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  return extractTarball(buffer);
}

function extractTarball(buffer: Buffer): Promise<LoadedFile[]> {
  return new Promise((resolve, reject) => {
    const files: LoadedFile[] = [];

    const parser = new TarParser({
      onReadEntry: (entry) => {
        if (entry.type !== 'File') {
          entry.resume();
          return;
        }

        const chunks: Buffer[] = [];
        entry.on('data', (chunk: Buffer) => chunks.push(chunk));
        entry.on('end', () => {
          // Strip the leading "<repo>-<sha>/" directory GitHub wraps entries in.
          const path = entry.path.split('/').slice(1).join('/');
          if (path) {
            files.push({
              path,
              content: Buffer.concat(chunks).toString('utf-8'),
            });
          }
        });
      },
    });

    parser.on('error', reject);
    parser.on('end', () => resolve(files));
    parser.end(buffer);
  });
}
