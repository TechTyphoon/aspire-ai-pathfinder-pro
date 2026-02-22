import { memo } from 'react'
import { Upload, CheckCircle2, X } from 'lucide-react'

interface UploadZoneProps {
  selectedFile: File | null
  resumeFileName: string | null
  isDragActive: boolean
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: () => void
  onDrop: (e: React.DragEvent) => void
  onClear: () => void
}

export const UploadZone = memo(({
  selectedFile,
  resumeFileName,
  isDragActive,
  onFileChange,
  onDragOver,
  onDragLeave,
  onDrop,
  onClear
}: UploadZoneProps) => {
  const displayName = selectedFile?.name || resumeFileName

  return (
    <div 
      className={`upload-zone relative ${isDragActive ? 'active' : ''} ${displayName ? 'border-primary/50 bg-primary/5' : ''}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      role="region"
      aria-label="Resume upload area"
    >
      <input
        id="resume-upload"
        type="file"
        className="sr-only"
        accept=".pdf,.docx,.txt"
        onChange={onFileChange}
        aria-describedby="upload-instructions"
      />
      <label htmlFor="resume-upload" className="cursor-pointer block focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 rounded-xl">
        {displayName ? (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mb-4" aria-hidden="true">
              <CheckCircle2 className="w-8 h-8 text-primary" />
            </div>
            <p className="text-lg font-semibold text-foreground mb-1">{displayName}</p>
            <p className="text-sm text-muted-foreground" id="upload-instructions">Click or drag to replace</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors" aria-hidden="true">
              <Upload className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-semibold text-foreground mb-1">Upload your resume</p>
            <p className="text-sm text-muted-foreground mb-2" id="upload-instructions">Drag and drop or click to browse</p>
            <p className="text-xs text-muted-foreground/70">PDF, DOCX, TXT up to 10MB</p>
          </div>
        )}
      </label>
      {displayName && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onClear()
          }}
          className="absolute top-4 right-4 p-2 rounded-lg bg-muted/50 hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label={`Remove resume: ${displayName}`}
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      )}
    </div>
  )
})

UploadZone.displayName = 'UploadZone'
