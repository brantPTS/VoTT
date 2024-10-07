import { IpcRendererLog } from "./ipcRendererLog"

const log = { 
    info: (message:string): Promise<void> => { 
        return IpcRendererLog.send("RENDERER_LOG", message)
    }
}

export default log;