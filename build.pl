#!/usr/bin/perl

use strict;
use TryCatch;
use File::Path;
use File::Copy;
use File::Copy::Recursive qw(fcopy rcopy dircopy);
use Archive::Zip qw( :ERROR_CODES :CONSTANTS );   

sub END {
    print STDERR "Ok";
    sleep(5);  
}

my $build_dir = './workspace/build_dir/';
my $target_dir = './workspace/target_dir';
my $tmp_dir = './workspace/tmp';
my @files = ('img', 'lib');

try {
    
    
    #rmdir $build_dir or print SYSERR $!;
    rmtree( $build_dir, 1) or print SYSERR $!;
    mkdir $build_dir or die $!;
	rmtree( $tmp_dir, 1) or print SYSERR $!;
	mkdir $tmp_dir or die $!;
    
    foreach(@files)
    {
        dircopy("./$_","$build_dir/$_") or die $!;
    }
    
    my @files = glob("./*.*");

    for my $file (@files) {
        if($file ne './build.pl'){
            print STDERR $file."\n";
            copy("./$file", $build_dir) or die "Copy failed: $!";
        }
    }
    
	print STDERR "Obfuscete: background.js, park.js...";
    `java -jar ./workspace/closureJS/compiler.jar --js $build_dir/background.js --js_output_file $build_dir/background.js`;
	#`java -jar ./workspace/closureJS/compiler.jar --js $build_dir/park.js --js_output_file $build_dir/park.js`;
	print STDERR "Ok\n";
	
	# Just test for JS error no really used obfuscated files.

	#my @files = glob("$build_dir/*.js");
	#push (@files, glob("$build_dir/modules/*.js"));
    #for my $file (@files) {
    #    if($file ne './build.pl'){
    #        print "Trying to sysntax check for $build_dir/$file...";
    #        `java -jar ./closureJS/compiler.jar --js $file --js_output_file ./tmp/dummy.js`;
    #        print "OK\n";
    #    }
    #}
	
	print STDERR "Check all JS syntax...\n";
    my $command = "java -jar ./workspace/closureJS/compiler.jar --js ".$build_dir."*.js --js_output_file ".$tmp_dir."/dummy.js";
    print STDERR $command;
    `$command`;
	print STDERR "Ok\n";
    
    
    mkdir $target_dir or print SYSERR $!;
    
    my $zip = Archive::Zip->new() or die $!;
    my $dir_member = $zip->addTree( $build_dir ) or print SYSERR $!;
    my $status = $zip->writeToFileNamed( "$target_dir/AutomaticTabsCleanerSuspender.zip" ) or print SYSERR $!;
}
catch ($err)
{
    print STDERR $err;
}
