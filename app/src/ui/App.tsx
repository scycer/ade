import "./index.css";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar, NavigationProvider } from "@/components/app-sidebar";

export function App() {

  return (
    <NavigationProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
        <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <SidebarTrigger />
          <div className="flex-1">
            <h1 className="text-lg font-semibold">My App</h1>
          </div>
        </header>
        <main className="flex-1 p-6">
          <div className="min-h-screen flex items-center justify-center">
            <h1 className="text-4xl">Hello</h1>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
    </NavigationProvider>
  );
}

export default App;