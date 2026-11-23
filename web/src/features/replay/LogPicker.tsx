import { useRef, type ReactNode } from "react";
import { Button } from "@/ui/controls/Button";

const LOG_FILES = ".log,.txt,text/plain";

interface LogButtonProps {
  children: ReactNode;
  onFile: (file: File) => void;
}

/** A button that asks for a log file from the disk of the visitor. */
export function LogButton({ children, onFile }: LogButtonProps) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={input}
        type="file"
        accept={LOG_FILES}
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file !== undefined) onFile(file);
          event.target.value = "";
        }}
      />
      <Button onClick={() => input.current?.click()}>{children}</Button>
    </>
  );
}
