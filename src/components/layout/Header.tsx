import { Sparkles } from 'lucide-react'

export const Header = () => {
  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
              <div className="absolute -inset-0.5 -z-10 rounded-xl bg-gradient-to-br from-primary to-secondary opacity-50 blur-lg" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                <span className="gradient-text">ASPIRO</span>
                <span className="text-foreground"> AI</span>
              </h1>
              <p className="text-xs text-muted-foreground">Your AI Career Assistant</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/50 border border-border/50">
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm text-muted-foreground">AI Ready</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
