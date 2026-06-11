interface FileListProps {
  files: string[];
}

export function FileList({ files }: FileListProps) {
  return (
    <ul className="file-list">
      {files.map((file) => (
        <li key={file}>
          <code>{file}</code>
        </li>
      ))}
    </ul>
  );
}
