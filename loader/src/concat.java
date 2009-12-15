import java.io.*;
import java.util.*;

public class concat {
		
	private static ArrayList<String> multisplit(ArrayList<String> org, String c) {
		ArrayList<String> rv = new ArrayList<String>();
		for(String r : org)
			for(String s : r.split(c)) {
				s = s.trim();
				if(s.startsWith("*")) s = s.substring(1).trim();
				if(!"".equals(s)) rv.add(s);
			}
		return rv;
	}
	
	/**
	 * Manage this file to be written down with its dependance in the ouput file
	 * @param output Output file
	 * @param fileName This input file
	 * 
	 * @param already The list of file names that were already "outputted"
	 * @param planned The list of file names that still have to be "outputted"
	 * @param running The list of file names that are in the process of "outputment"
	 * @throws Exception 
	 */
	public static void augment(
			Writer output_file,
			PrintWriter files,
			String fileName,
			String ext,
			Set<String> already,
			ArrayList<String> planned,
			ArrayList<String> running) throws Exception {
		

		/*for(int uhuh = 0; running.size()>uhuh;++uhuh) System.out.print("|");
		System.out.print("+");
		System.out.println("Adding "+fileName);*/
		
		if(running.contains(fileName)) {
			String e = "";
			for(String p: running) e += p+"->";
			throw new Exception("Circular references: " + e + fileName + ".");
		}
		running.add(fileName);
		try {
			RandomAccessFile file = null;
			String line = null;
			CharArrayWriter sb = new CharArrayWriter();
			
			try {
				file = new RandomAccessFile(fileName+"."+ext, "r");
				while((line = file.readLine()) != null) {
					ArrayList<String> rel = new ArrayList<String>();
					int ndx;
					if(-1< (ndx=line.indexOf("//#"))) {
						rel.add(line.substring(ndx + 3));
						line = line.substring(0, ndx);
					} else if(-1< (ndx=line.indexOf("/*#"))) {
						String cmntLine = line.substring(ndx + 3);
						line = line.substring(0, ndx);
						while(null!= cmntLine && -1>=(ndx=cmntLine.indexOf("*/"))) {
							rel.add(cmntLine);								
							cmntLine = file.readLine();
						}
						line += cmntLine.substring(ndx+2);
						rel.add(cmntLine.substring(0,ndx));								
					}
					if(0< rel.size()) {
						rel = concat.multisplit(rel, ",");
						rel = concat.multisplit(rel, "\n");
						rel = concat.multisplit(rel, "\r");
						
						char mode = '!';
	
						for(String s: rel) {
							if(s.contains(":")) {
								mode = s.toLowerCase().charAt(0);
								if(s.endsWith(":")) continue;
								s = s.split(":")[1].trim();
							}
							switch(mode){
							case 'r':
								if(!already.contains(s))
								{
									if(planned.contains(s)) planned.remove(s);
									concat.augment(output_file, files, s, ext, already, planned, running);
								}
								break;
							case 'i':
								concat.augment(sb, files, s, ext, already, planned, running);
								break;
							case 'u':
								if(!already.contains(s) && !planned.contains(s) && !running.contains(s))
									planned.add(s);
								break;
							default: throw new Exception("Required, used or included?");
							}
						}
					}
					if(null!= output_file) {
						sb.append(line);
						sb.append("\n");
					}
				}
				
				if(null!= files) files.println("'"+fileName+"',");
				
				if(null!= output_file) {
					output_file.append("/*FILE: " + fileName+ "." + ext + "*/\n");
					output_file.append(sb.toString());
				}
				
			} catch (FileNotFoundException fnf) {
				System.err.println("File:" + fileName + "." + ext + " not found!");
			} catch (Exception e) {
				System.err.println(e);
			} finally {
				if(file != null) {
					try {
						file.close();
					} catch (IOException io) {
						System.err.println(io);
					}
				}
			}
		} finally{
			running.remove(fileName);
			already.add(fileName);	
			//for(int uhuh = 0; planned.size()>uhuh;++uhuh) System.out.print(" - "+planned.get(uhuh));
			//System.out.println();
		}
	}
	
	public static void main(String args[]) throws Exception {
		String x = "js";
		if(args.length!=1) {
	    	System.err.println("Syntax: There is some problem with the arguments!");
	    	return;
	    }
		Properties properties = new Properties();
	    try {
	        properties.load(new FileInputStream(args[0]));
	    } catch (Exception e) {
	    	System.err.println("Bad configuration file!");
	    	return;
	    }
		//System.out.println(properties.getProperty("outputFile"));
		FileWriter output_file = null;
		try {
			if (null!= properties.getProperty("output"))
				output_file = new FileWriter(properties.getProperty("output"));
		} catch (Exception e) {
			System.out.println("OUTPUT: Cannot write the file " + properties.getProperty("output"));
		}
		PrintWriter files = null;
		try {
			if(null!= properties.getProperty("list"))
				files = new PrintWriter(new FileWriter(properties.getProperty("list")));
		} catch (Exception e){
			System.out.println("LIST: Cannot write the file " + properties.getProperty("list"));
		}
		
		ArrayList<String> planned = new ArrayList<String>();
		Set<String> already = new HashSet<String>();
		ArrayList<String> running = new ArrayList<String>();
		String input = properties.getProperty("input");
		String[] input_files = input.split(",");
		
		for(int i=0;i<input_files.length;i++) {
			planned.add(input_files[i].trim());
		}

		while(0<planned.size())
			augment(output_file, files, planned.remove(0), x, already, planned, running);
	    
		//assert: running.size() == 0
		if (null!= output_file) output_file.close();
		if (null!= files) files.close();
	}
}
