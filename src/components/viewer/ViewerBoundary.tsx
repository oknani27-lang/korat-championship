import { Component } from 'react'
import type { ReactNode } from 'react'

export class ViewerBoundary extends Component<{ children: ReactNode; fallback?: ReactNode; onError?: (error: Error) => void }, { error: Error | null }> {
  state: { error: Error | null } = { error: null }
  static getDerivedStateFromError(error: Error) { return { error } }
  componentDidCatch(error: Error) { this.props.onError?.(error) }
  render() {
    if (!this.state.error) return this.props.children
    if (this.props.fallback !== undefined) return this.props.fallback
    return <div className="canvas-fallback" role="alert">ไม่สามารถโหลดพื้นที่ 3D ได้<br/><small>ตรวจการเชื่อมต่อ ไฟล์โมเดล และการรองรับ WebGL</small><details><summary>รายละเอียดข้อผิดพลาด</summary>{this.state.error.message}</details><button className="secondary" onClick={() => window.location.reload()}>โหลดหน้าใหม่</button></div>
  }
}
