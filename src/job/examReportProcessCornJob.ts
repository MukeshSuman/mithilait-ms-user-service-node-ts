import { ReportService, SpeechService } from "../services"
const reportIds: Map<string, string> = new Map()

export const startExamReportProcessCronJob = async () => {
    const reportService = new ReportService();
    
    const repRes = await reportService.getLimitedReportIds(3)
    if (repRes && !repRes.length) {
        console.log("All Report Completed")
    } else {
        repRes.map(value => {
            reportIds.set(value, value)
        });
    }
    recursiveJob()
}

const recursiveJob = () => {
    const allKeys = [...reportIds.keys()];
    if(allKeys.length){
        const reportId = allKeys[0];
        const speechService = new SpeechService()
        speechService.processExam(reportId, () => {
            reportIds.delete(reportId);
            recursiveJob()
        })
    } else {
        console.log("RecursiveJob: All Report Completed")
    }
}