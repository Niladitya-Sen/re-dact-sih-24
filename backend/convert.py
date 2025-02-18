import os
import tabula
import pandas as pd


def pdf_to_excel(pdf_path, excel_path):
    # Extract tables from PDF
    tables = tabula.read_pdf(pdf_path, pages="all", multiple_tables=True)

    # Create a Pandas Excel writer to save extracted tables to Excel
    with pd.ExcelWriter(excel_path, engine="openpyxl") as writer:
        # Loop through extracted tables and save each as a sheet
        for i, table in enumerate(tables):
            table.to_excel(writer, sheet_name=f"Sheet{i+1}", index=False)

    print(f"Successfully converted {pdf_path} to {excel_path}")


# Example usage
pdf_path = f"{os.path.dirname(__file__)}/pdf/table-test.pdf"
excel_path = "example.xlsx"
pdf_to_excel(pdf_path, excel_path)
