Color Interface Project Foundation
==================================

Use rake to build:

rake			Runs rake:build
rake:build		Runs rake:compress then rake:document
rake:compile	Compiles the files according to their FileLayout then compresses cip.css
rake:compress	Runs rake:compile then compresses cip.*.src.js into cip.*.js
rake:document	Runs rake:compile then runs naturaldocs to generate documentation in doc/
rake:distribute	Destructively distributes all compiled and compressed files to the paths specified in ./targets, then rsyncs the image folders. Use with caution!


Add the following lines to your <head>:

<script src="/cip/cip.js" type="text/javascript"></script>
<!-- Include your JS files depending on CIP, Mootools or Taffy here. -->
<link rel="stylesheet" href="/cip/cip.css" type="text/css" media="screen" title="CIP" charset="utf-8"/>
<!-- Include your CSS files depending on CIP here. -->