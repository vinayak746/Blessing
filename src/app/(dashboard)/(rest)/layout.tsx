import { AppHeader } from "@/components/app-header";

const layout = ({children}:{children: React.ReactNode;}) => {
  return (
    <div>
        <>
       <AppHeader />
       <main className="flex-1">{children}</main> 
        </>
            
        
    </div>
  )
}

export default layout
