import './globals.css';
import type {Metadata} from 'next';
export const metadata:Metadata={title:'X Watch | 推文哨兵',description:'公开 X 账号发推与可用性监控'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="zh-CN"><body>{children}</body></html>}
