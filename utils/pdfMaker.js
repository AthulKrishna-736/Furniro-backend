import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export const generateSalesPdf = async () => {
    const pdfDoc = await PDFDocument.create();
    
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const page = pdfDoc.addPage([600, 400]);
    const { width, height } = page.getSize();
    const fontSize = 18;
    
    page.drawText('Sales Report', {
      x: 50,
      y: height - 50,
      size: fontSize,
      font,
      color: rgb(0, 0, 0),
    });
    
    page.drawText('Hello World', {
      x: 50,
      y: height - 100,
      size: fontSize,
      font,
    });
  
    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
  };
  
export const downloadPdf = async (req, res) => {
    const { totalSales, totalOrders } = req.query;
    
    if (!totalSales || !totalOrders) {
      return res.status(400).json({ message: 'Sales data is missing' });
    }
  
    const salesData = {
      totalSales: totalSales,
      totalOrders: totalOrders,
    };
  
    // Generate the PDF
    const pdfBytes = await generateSalesPdf(salesData);
    
    console.log('Generated PDF Bytes:', pdfBytes);
  
    // Ensure the headers are set to send the PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=sales_report.pdf');
    res.send(pdfBytes);  // Sending the PDF as response
  };
  
  
  