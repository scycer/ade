import {
  Home,
} from "lucide-react";
import { createContext, useContext, useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";

// Simple navigation context
interface NavigationContextType {
  currentRoute: string;
  setCurrentRoute: (route: string) => void;
}

const NavigationContext = createContext<NavigationContextType>({
  currentRoute: "/home",
  setCurrentRoute: () => {},
});

export const useNavigation = () => useContext(NavigationContext);

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [currentRoute, setCurrentRoute] = useState("/home");

  return (
    <NavigationContext.Provider value={{ currentRoute, setCurrentRoute }}>
      {children}
    </NavigationContext.Provider>
  );
}

// Navigation data
const data = {
  main: [
    {
      title: "Home",
      url: "/home",
      icon: Home,
    },
  ],
};

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const { currentRoute, setCurrentRoute } = useNavigation();
  const { setOpenMobile } = useSidebar();

  const handleLinkClick = (url: string) => {
    setCurrentRoute(url);
    setOpenMobile(false);
  };


  return (
    <Sidebar collapsible="icon" {...props}>
      <div className="m-4 text-center text-lg font-bold">My App</div>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarMenu>
            {data.main.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  tooltip={item.title}
                  onClick={() => handleLinkClick(item.url)}
                  isActive={currentRoute === item.url}
                >
                  <item.icon className="size-4" />
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}