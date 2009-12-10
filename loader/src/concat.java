import java.io.*;

public class concat {
	public static void concatenate(String fileName, PrintWriter output_file) {
		RandomAccessFile file = null;
		String line = null;
		String tmp = null;
		
		try {
			file = new RandomAccessFile(fileName, "r");
			while((line = file.readLine()) != null) {
				if(line.trim().length() == 0) output_file.println();
				else {
					if(line.substring(0, 3).equals("//=")||line.substring(0, 3).equals("/*=")) {
						tmp = line.substring(3,line.length());
						concat.concatenate(tmp, output_file);
					}
					else {
						output_file.print(line);
						output_file.println();
					}
				}
			}
			return;
		} catch (FileNotFoundException fnf) {
			System.err.println("File:" + fileName + " not found!");
		} catch (Exception e) {
			System.err.println(e);
		} finally {
			if(file != null) {
				try {
					file.close();
				} catch (IOException io) {
				}
			}
		}
	}
	
	public static void main(String args[]) throws Exception {
		PrintWriter output_file = new PrintWriter(new FileWriter("output.txt"));
		System.out.println("Printing to file...");
		for(int i=0; i<args.length; i++) {
			concat.concatenate(args[i], output_file);
		}
		output_file.close();
	}
}
