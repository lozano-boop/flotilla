import { ReactNode } from "react";

interface PageProps {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export default function Page({ title, subtitle, actions, children }: PageProps) {
  return (
    <div className="px-6 py-6 md:px-8 md:py-8">
      {(title || subtitle || actions) && (
        <div className="flex items-start md:items-center justify-between gap-4 mb-6">
          <div>
            {title && (
              <h1 className="text-xl md:text-2xl font-semibold text-foreground tracking-tight">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-1">
                {subtitle}
              </p>
            )}
          </div>
          {actions && <div className="shrink-0 flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
