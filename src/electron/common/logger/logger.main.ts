import log from "electron-log";
import path from "path";

log.transports.file.level = 'info';
const fname='log-'+new Date(Date.now()).toLocaleDateString('en-US',{
    year: "numeric",
    month: "2-digit",
   day: "2-digit",
  }).replace(/\//g,"-");
log.transports.file.resolvePath = () => path.join(`logs/${fname}.log`);

export default log;