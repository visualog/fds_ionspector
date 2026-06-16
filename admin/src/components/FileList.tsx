interface FileListProps {
  files: string[];
}

interface TokenListProps {
  tokens: string[];
}

interface InlineFileProps {
  path: string;
}

export function FileList({ files }: FileListProps) {
  return (
    <ul className="file-list">
      {files.map((file) => (
        <li aria-label={`File: ${file}`} key={file} title={`File: ${file}`}>
          <code>{file}</code>
        </li>
      ))}
    </ul>
  );
}

export function TokenList({ tokens }: TokenListProps) {
  return (
    <ul className="token-list">
      {tokens.map((token) => (
        <li aria-label={`Token: ${token}`} key={token} title={`Token: ${token}`}>
          <code>{token}</code>
        </li>
      ))}
    </ul>
  );
}

export function InlineFile({ path }: InlineFileProps) {
  return (
    <code aria-label={`File: ${path}`} className="inline-file" title={`File: ${path}`}>
      {path}
    </code>
  );
}
