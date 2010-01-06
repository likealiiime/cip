class FileLayout
  def initialize(prefix, *filenames)
    @filenames = filenames.collect { |f| "#{prefix}/#{f}.js" }
  end
  
  def compile_into(dest_file)
    FileLayout.compile(dest_file, *@filenames)
  end
  
  def self.compile(dest_file, *source_filenames)
    source_filenames.each do |filename|
      #puts "Compiling #{filename}..."
      open(filename, 'r') { |file| dest_file.write file.read }
      puts "Compiled #{filename} into #{File.basename(dest_file.path)}"
    end
  end
end

Mootools124Layout = FileLayout.new('src/lib', 'mootools-1.2.4-core', 'mootools-1.2.4.2-more')
Mootools123Layout = FileLayout.new('src/lib', 'mootools-1.2.3-core', 'mootools-1.2.3.1-more', 'taffy')
Mootools122Layout = FileLayout.new('src/lib', 'mootools-1.2.2-core', 'mootools-1.2.2.2-more', 'taffy')

LibLayout = Mootools124Layout
CIFoundationLayout = FileLayout.new('src/js/foundation',
  'extensions', 'CIEvent', 'CIObject', 'CIApplication', 'CIRequest',
  'CIRect', 'CIRequestable', 'CIResizeBehavior', 'CIView', #'CIStyle',
  'constants', 'main'
)
CIUILayout = FileLayout.new('src/js/ui',
  # Mixins
  'CIOffsettable',
  
  # Visual Components
  'CIStyle', 'CIButton', 'CITitle', 'CIPopupButton', 'CISourceList', 'CIFormField', 'CIForm', 'CITabPanel',
  'CIPanel', 'CICurtainPanel', 'CIToolbar', 'CITable', 'CIPaginator', 'CIFilter', 'CISheet', 'CIText', 'CIHud',
  'CIAutocomplete', 'CIIndicator', 'CIMenu', 'CIMenuItem', 'CIVerticalTabPanel',
  
  # Styles
  'CIStyleDefinitions'
)

CIP_FOUNDATION_FILENAME             = 'build/cip.foundation.src.js'
CIP_COMPRESSED_FOUNDATION_FILENAME  = 'build/cip.foundation.js'
CIP_COMPILED_FILENAME               = 'build/cip.src.js'
CIP_COMPRESSED_FILENAME             = 'build/cip.js'
FILES_TO_DISTRIBUTE = [
  CIP_COMPRESSED_FOUNDATION_FILENAME,
  CIP_FOUNDATION_FILENAME,
  CIP_COMPRESSED_FILENAME,
  CIP_COMPILED_FILENAME,
  'build/cip.css',
  'build/cip.src.css'
]
KB = 1024

desc "Compile all src/*/*.js files in the correct order into #{CIP_COMPILED_FILENAME}"
task :compile do
  FileUtils.mkdir_p('build')
  version_line = File.exist?(CIP_COMPILED_FILENAME) ? open(CIP_COMPILED_FILENAME, 'r') { |f| f.readline } : nil
  if version_line && version_line =~ /(\d+)\.(\d+)\.(\d+)/
    CIP_VERSION = "#{$1}.#{$2}.#{$3.to_i+1}"
    puts "Updating CIP build version to #{CIP_VERSION}"
  else
    CIP_VERSION = "0.4.0"
    puts "Resetting CIP build version to #{CIP_VERSION}"
  end
  
  puts
  puts "=== Building #{CIP_FOUNDATION_FILENAME} ==="
  open(CIP_FOUNDATION_FILENAME, 'w') do |foundation|
    foundation.puts "/*! #{CIP_VERSION} */"
    LibLayout.compile_into foundation
    CIFoundationLayout.compile_into foundation
  end
  
  puts
  puts "=== Building #{CIP_COMPILED_FILENAME} ==="
  open(CIP_COMPILED_FILENAME, 'w') do |compilation|
    compilation.puts "/*! #{CIP_VERSION} */"
    LibLayout.compile_into        compilation
    CIFoundationLayout.compile_into compilation
    CIUILayout.compile_into        compilation
  end
  
  puts
  puts "=== Compressing cip.src.css ==="
  FileUtils.cp('src/css/cip.src.css', 'build/cip.src.css')
  sh "java -jar tools/yuicompressor-2.4.2.jar src/css/cip.src.css -o build/cip.css"
end

desc "Compress all src"
task :compress => :compile do
  puts
  puts "=== Compressing #{CIP_FOUNDATION_FILENAME} ==="
  puts "Before compression, #{CIP_FOUNDATION_FILENAME} is #{File.size(CIP_FOUNDATION_FILENAME)/KB} KB"
  sh "java -jar tools/yuicompressor-2.4.2.jar #{CIP_FOUNDATION_FILENAME} -o #{CIP_COMPRESSED_FOUNDATION_FILENAME}"
  puts "After compression, #{CIP_FOUNDATION_FILENAME} is #{File.size(CIP_COMPRESSED_FOUNDATION_FILENAME)/KB} KB"
  
  puts
  puts "=== Compressing #{CIP_COMPILED_FILENAME} ==="
  puts "Before compression, #{CIP_COMPILED_FILENAME} is #{File.size(CIP_COMPILED_FILENAME)/KB} KB"
  sh "java -jar tools/yuicompressor-2.4.2.jar #{CIP_COMPILED_FILENAME} -o #{CIP_COMPRESSED_FILENAME}"
  puts "After compression, #{CIP_COMPRESSED_FILENAME} is #{File.size(CIP_COMPRESSED_FILENAME)/KB} KB"
end

desc "Generate documentation"
task :document, [:options] => :compile do |task, args|
  args.with_defaults(:options => '')
  
  FileUtils.mkdir_p('tools/naturaldocs/projects/foundation')
  puts
  puts "=== Generating documentation for Foundation ==="
  sh "./tools/naturaldocs/NaturalDocs --input src/js/foundation --output HTML doc/ --only-file-titles --documented-only --project tools/naturaldocs/projects/foundation #{args.options}"
end

desc "Copy #{FILES_TO_DISTRIBUTE.join(',')} to the targets in the targets file, then rsync the images."
task :distribute do
  puts
  puts "=== Distributing files ==="
  targets = File.readlines('targets').collect { |t| t.strip }
  targets.each do |target|
    [target, "#{target}/images", "#{target}/images/editing", "#{target}/images/selected", "#{target}/images/widgets"].each do |dir|
      FileUtils.mkdir_p(dir)
    end
    
    FileUtils.cp_r(FILES_TO_DISTRIBUTE, target)
    puts "Copied #{FILES_TO_DISTRIBUTE.join(', ')} to #{target}"
    ['.', 'editing', 'selected', 'widgets'].each do |subdir|
      `rsync -aq build/images/#{subdir}/*.png #{target}/images/#{subdir}`
      `rsync -aq build/images/#{subdir}/*.gif #{target}/images/#{subdir}`
    end
  end
end

task :build do
  Rake::Task[:compress].invoke
  Rake::Task[:document].execute
  puts
  puts "=== Built CIP #{CIP_VERSION} ==="
end
task :default => :build