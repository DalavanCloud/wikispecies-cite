var Parser = function () {};

//----------------------------------------------------------------------------------------
// Javascript does not provide the PCRE recursive parameter (?R) (unlike PHP) so we need
// a way to handle recursive regexp, see http://stackoverflow.com/a/4414453	
	
// http://blog.stevenlevithan.com/archives/javascript-match-nested
// (c) 2007 Steven Levithan <stevenlevithan.com>
// MIT License

/*** matchRecursive
	accepts a string to search and a format (start and end tokens separated by "...").
	returns an array of matches, allowing nested instances of format.

	examples:
		matchRecursive("test",          "(...)")   -> []
		matchRecursive("(t(e)s)()t",    "(...)")   -> ["t(e)s", ""]
		matchRecursive("t<e>>st",       "<...>")   -> ["e"]
		matchRecursive("t<<e>st",       "<...>")   -> ["e"]
		matchRecursive("t<<e>>st",      "<...>")   -> ["<e>"]
		matchRecursive("<|t<e<|s|>t|>", "<|...|>") -> ["t<e<|s|>t"]
*/
var matchRecursive = function () {
	var	formatParts = /^([\S\s]+?)\.\.\.([\S\s]+)/,
		metaChar = /[-[\]{}()*+?.\\^$|,]/g,
		escape = function (str) {
			return str.replace(metaChar, "\\$&");
		};

	return function (str, format) {
		var p = formatParts.exec(format);
		if (!p) throw new Error("format must include start and end tokens separated by '...'");
		if (p[1] == p[2]) throw new Error("start and end format tokens cannot be identical");

		var	opener = p[1],
			closer = p[2],
			/* Use an optimized regex when opener and closer are one character each */
			iterator = new RegExp(format.length == 5 ? "["+escape(opener+closer)+"]" : escape(opener)+"|"+escape(closer), "g"),
			results = [],
			openTokens, matchStartIndex, match;

		do {
			openTokens = 0;
			while (match = iterator.exec(str)) {
				if (match[0] == opener) {
					if (!openTokens)
						matchStartIndex = iterator.lastIndex;
					openTokens++;
				} else if (openTokens) {
					openTokens--;
					if (!openTokens)
						results.push(str.slice(matchStartIndex, match.index));
				}
			}
		} while (openTokens && (iterator.lastIndex = matchStartIndex));

		return results;
	};
}();
  


//----------------------------------------------------------------------------------------
// If we are adding a string to a regular expression patern then we need to escape various
// characters
function escape_pattern(pattern) {

  console.log('before=', pattern);

  pattern = pattern.replace(/{/g, '\\{');
  pattern = pattern.replace(/}/g, '\\}');

  pattern = pattern.replace(/\[/g, '\\[');
  pattern = pattern.replace(/\]/g, '\\]');

  pattern = pattern.replace(/\(/g, '\\(');
  pattern = pattern.replace(/\)/g, '\\)');

  pattern = pattern.replace(/\'/g, "\\'");
  pattern = pattern.replace(/\+/g, '\\+');
  pattern = pattern.replace(/\//g, '\\/');

  pattern = pattern.replace(/\|/g, '\\|');
  pattern = pattern.replace(/\*/g, '\\*');

  console.log('after=', pattern);

  return pattern;
}

/*
//----------------------------------------------------------------------------------------
function output(data) {
  if (1) {
    $('#output').html(JSON.stringify(data, null, 2));
  } else {
    // emit(null, data);
  }
}
*/

//----------------------------------------------------------------------------------------
// Parse the template from hell (Zootaxa)
function parse_zootaxa(string, citation) {

  citation.journal = 'Zootaxa';
  citation.ISSN = ['1175-5326'];
  console.log("string=" + string);
  var result = string.match(/zootaxa\|(\d+)\|(\d+)\|(\d+)\|(\d+)(\|(\d+))?(\|(\d+))?(\|(\d+))?/i);

  // For years 2013 and above use: <tt>&#123;{zootaxa|year|volume number|fascicle number|start page|end page|article number|PDF}}</tt>
  // for open access [<tt>PDFo</tt> for no preview].<br /> For years 2012 and below use: <tt>&#123;{zootaxa|year|volume number|start page|end page}}</tt>.

  if (result) {
    //console.log('zootaxa=' + JSON.stringify(result));
    citation.parts['JOURNAL'].push('{{' + result[0] + '}}');

    switch (result[1]) {
        
       case "2007":
        citation.volume = result[2];
        citation.spage = result[3];
        citation.page = citation.spage;
        citation.epage = result[4];
        citation.page += '-' + citation.epage;

        citation.pdf = 'http://www.mapress.com/zootaxa/' + result[1] + '/f/z0' + citation.volume + 'p' + ("000" + citation.epage).slice(-3) + 'f.pdf';

        
        break;

       
        
      case "2009":
        citation.volume = result[2];
        citation.spage = result[3];
        citation.page = citation.spage;
        citation.epage = result[4];
        citation.page += '-' + citation.epage;

        // PDF link to abstract
        // http://mapress.com/zootaxa/{{{1}}}/f/z0{{{2}}}p{{{4}}}f.pdf
        citation.pdf = 'http://www.mapress.com/zootaxa/' + result[1] + '/f/z0' + citation.volume + 'p' + ("000" + citation.epage).slice(-3) + 'f.pdf';

        // PDF to actual article (there's a switch for open access or not...)

        break;

        // {{zootaxa|year|volume number|fascicle number|start page|end page|article number|PDF}}
      case '2014':
      case '2015':
      case '2016':
      case '2017':
        citation.volume = result[2];
        citation.issue = result[3];
        citation.spage = result[4];
        citation.page = citation.spage;
        citation.epage = result[6];
        citation.page += '-' + citation.epage;
        citation['article-number'] = result[8];

        // DOI
        citation.DOI = '10.11646/zootaxa.' + citation.volume + '.' + citation.issue + '.' + citation['article-number'];
        break;

      default:
        break;
    }
  }

  return citation;
}

//----------------------------------------------------------------------------------------
// {{AEMNP|53|2|633|648}}
function parse_aemnp(string, citation) {

  citation.journal = 'Acta Entomologica Musei Nationalis Pragae';
  citation.ISSN = ['0374-1036'];
  //console.log("string=" + string);
  var result = string.match(/AEMNP\|(\d+)\|(\d+)\|(\d+)\|(\d+)/);

  if (result) {
    //console.log('AEMNP=' + JSON.stringify(result));
    citation.parts['JOURNAL'].push('{{' + result[0] + '}}');

    citation.volume = result[1];
    citation.issue = result[2];
    citation.spage = result[3];
    citation.page = citation.spage;
    citation.epage = result[4];
    citation.page += '-' + citation.epage;

    // 53_2/53_2_633.pdf
    citation.pdf = 'http://www.aemnp.eu/PDF/' + citation.volume + '_' + citation.issue + '/' + citation.volume + '_' + citation.issue + '_' + citation.spage + '.pdf';

  }

  return citation;
}

//----------------------------------------------------------------------------------------
// parse a wiki link of the form [[<name>|<link>]]
function parse_link(string) {
  var link = {};

  var result = string.match(/^\[\[(.*)\|(.*)\]\]$/);

  if (result) {
    link.name = result[2];
    link.link = result[1];
  }

  return link;
}

//----------------------------------------------------------------------------------------
function parse_reference(string) {
 var debug = false;
  
  // do any pre-parsing cleaning here
  // errat are interesting but can completely mangle parsing, e.g.
  // * {{aut|Zhang, B.-s.}}; {{aut|Zhang, F.}}; {{aut|Chen, P.}} 2011: Species of the genus ''Mallinella'' Strand, 1906 (Araneae: Zodariidae) from Hainan Island, China. [[ISSN 1175-5326|''Zootaxa'']], 2986: 55–62. [http://mapress.com/zootaxa/2011/f/z02986p062f.pdf Preview] [erratum in [[ISSN 1175-5326|''Zootaxa'']], 3035: 68. (2011) [http://mapress.com/zootaxa/2011/f/zt03035p068.pdf PDF]]
  if (string.match(/\[erratum in/)) {
    string = string.replace(/\[erratum in.*$/, '');
  }
  
  // commas can break journal parsing
  string = string.replace(/d'([A-Z])/, 'd&quot;$1');    
  
  // citation object
  var citation = {};
  
  citation.status = 'not parsed';
  
  // store the unparsed citation string without formatting (could be used for search)
  citation.unstructured = string;
  
  // clean crap from unstructured string
  //citation.unstructured = citation.unstructured.replace(/\[http(.*)\]/g, '');
  
  var url_pattern = '\\[https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%_\\+.~#?&//=]{2,256}\\.[a-z]{2,4}\\b(\\/[-a-zA-Z0-9@:%_\\+.~#?&//=]*)?';

  citation.unstructured = citation.unstructured.replace(RegExp(url_pattern, 'g'), '');
  
  
  citation.unstructured = citation.unstructured.replace(/\n/g, '');
  citation.unstructured = citation.unstructured.replace(/\[\d+(.*)]/g, '');
  citation.unstructured = citation.unstructured.replace(/\*/g, '');
  citation.unstructured = citation.unstructured.replace(/\'/g, '');
  
  citation.unstructured = citation.unstructured.replace(/<includeonly>/g, '');
  citation.unstructured = citation.unstructured.replace(/<\/includeonly>/g, '');
  citation.unstructured = citation.unstructured.replace(/<noinclude>/g, '');
  citation.unstructured = citation.unstructured.replace(/<\/noinclude>/g, '');
  citation.unstructured = citation.unstructured.replace(/&nbsp;/g, '');  
  citation.unstructured = citation.unstructured.trim();
  
  // clean {{...}} markup
  var result = matchRecursive(citation.unstructured, "{{...}}");
  for (var i in result) {
    console.log(result[i]);
    
    var matched = false;
    var match = null;
    var pattern = '';

    if (!matched) {
      if (match = result[i].match(/^a\|(.*)\|(?:.*)/)) {
        pattern = match[0];
        pattern = pattern.replace(/\|/g, "\|");
        citation.unstructured = citation.unstructured.replace(pattern, match[1]);
        matched = true;
      }
    }
    
    if (!matched) {
      if (match = result[i].match(/aut\|\[\[(.*)\|(.*)\]\]/)) {
        pattern = match[0];
        //alert(pattern)
        pattern = pattern.replace(/\|/g, "\|");
        citation.unstructured = citation.unstructured.replace(pattern, match[1]);
        matched = true;
      }
    }     

    if (!matched) {
      if (match = result[i].match(/aut\|(.*)/)) {
        pattern = match[0];
        pattern = pattern.replace(/\|/g, "\|");
        citation.unstructured = citation.unstructured.replace(pattern, match[1]);
        matched = true;
      }
    }  
    
    if (!matched) {  
        pattern = result[i];
        pattern = pattern.replace(/\|/g, "\|");
        citation.unstructured = citation.unstructured.replace(pattern, '');
    }    
    
  }
  citation.unstructured = citation.unstructured.replace(/{{/g, '');
  citation.unstructured = citation.unstructured.replace(/}}/g, '');
  
  // clean [[...]] markup
  var result = matchRecursive(citation.unstructured, "[[...]]");
  for (var i in result) {
    console.log(result[i]);
    
    var matched = false;
    var match = null;
    var pattern = '';

    if (!matched) {
      if (match = result[i].match(/ISSN\s+(.*)\|(.*)/)) {
        pattern = match[0];
        pattern = pattern.replace(/\|/g, "\|");
        citation.unstructured = citation.unstructured.replace(pattern, match[2]);
        matched = true;
      }
    }
    
    if (!matched) {  
        pattern = result[i]; 
        pattern = pattern.replace(/\|/g, "\|");
        citation.unstructured = citation.unstructured.replace(pattern, '');
    } 
    
  }
  citation.unstructured = citation.unstructured.replace(/\[\[/g, '');
  citation.unstructured = citation.unstructured.replace(/\]\]/g, '');
  // any stray ] after replacing URLs
  citation.unstructured = citation.unstructured.replace(/\]/g, '');
  citation.unstructured = citation.unstructured.replace(/&quot;/g, "'");
  citation.unstructured = citation.unstructured.replace(/PDF/g, '');
  citation.unstructured = citation.unstructured.replace(/\s\s+/g, ' ');
  
  citation.author = [];
  citation['alternative-id'] = [];
  
  citation.parts = {};
  citation.parts['AUTHOR'] = [];
  citation.parts['JOURNAL'] = [];
  citation.parts['VOLUME-PAGINATION'] = [];
  
  citation.matched = {};
    
  var result = null;
  var pattern = null;

  // linked journal, issue not bold
  if (citation.parts['VOLUME-PAGINATION'].length == 0) {
    pattern = /''\]\](\s+\((\d+)\))?,?\s+(''')?(\d+)(''')?(\((.*)\))?:\s*(\d+)([-|–](\d+))?/;    
    result = string.match(pattern);

    if (result) {
      console.log(JSON.stringify(result));

      citation.parts['VOLUME-PAGINATION'].push(result[0]);
      
      citation.matched['VOLUME-PAGINATION'] = pattern.toString();   

      citation.journal = result[1];
      citation.volume = result[4];

      if (result[7]) {
        citation.issue = result[7];
      }

      citation.spage = result[8];
      citation.page = citation.spage;
      if (result[10]) {
        citation.epage = result[10];
        citation.page += '-' + citation.epage;
      }
      //emit(i, result[i]);
    }
  }
  

  // linked journal
  if (citation.parts['VOLUME-PAGINATION'].length == 0) {
    pattern = /\]\]''(\s+\((\d+)\))?,?\s+(''')?(\d+)(''')?(\((.*)\))?:\s*(\d+)([-|–](\d+))?/;
    result = string.match(pattern);

    if (result) {
      console.log(JSON.stringify(result));

      citation.parts['VOLUME-PAGINATION'].push(result[0]);
      
      citation.matched['VOLUME-PAGINATION'] = pattern.toString();  

      citation.journal = result[1];
      citation.volume = result[4];
      citation.spage = result[8];
      citation.page = citation.spage;
      if (result[10]) {
        citation.epage = result[10];
        citation.page += '-' + citation.epage;
      }
    }
  }

  // linked journal
  if (citation.parts['VOLUME-PAGINATION'].length == 0) {
    // '']], 34, 152–178.
    pattern = /''\]\],\s*(.*),\s*(\d+)([-|–](\d+))?/;
    result = string.match(pattern);

    if (result) {
      console.log(JSON.stringify(result));

      citation.parts['VOLUME-PAGINATION'].push(result[0]);
      
      citation.matched['VOLUME-PAGINATION'] = pattern.toString();        

      citation.volume = result[1];
      citation.spage = result[2];
      citation.page = citation.spage;
      if (result[4]) {
        citation.epage = result[4];
        citation.page += '-' + citation.epage;
      }
    }
  }
  
  // linked journal
  // '']], 126 (3): 515–532
  if (citation.parts['VOLUME-PAGINATION'].length == 0) {
    // '']], 34, 152–178.
    pattern = /''\]\],\s*(\d+)(\s*\((.*)\))?:\s*(\d+)([-|–](\d+))?/;
    result = string.match(pattern);

    if (result) {
      console.log(JSON.stringify(result));

      citation.parts['VOLUME-PAGINATION'].push(result[0]);
      
      citation.matched['VOLUME-PAGINATION'] = pattern.toString();        

      citation.volume = result[1];
      
      if (result[3]) {
        citation.issue = result[3];
      }
      citation.spage = result[4];
      citation.page = citation.spage;
      if (result[5]) {
        citation.epage = result[5];
        citation.page += '-' + citation.epage;
      }
    }
  }  
  
  // linked journal, volume bold, issue not, stray stuff after journal
  // https://species.wikimedia.org/w/index.php?title=Template:Razowski,_1983&action=edit
  // '']] (n.f.), '''6'''(1): 38-40.
  if (citation.parts['VOLUME-PAGINATION'].length == 0) {
    pattern = /''\]\]\s*(?:.*),\s+'''(\d+)'''\s*\((.*)\):\s*(\d+)([-|–](\d+))?/;
    result = string.match(pattern);

    if (result) {
      console.log(JSON.stringify(result));

      citation.parts['VOLUME-PAGINATION'].push(result[0]);
      
      citation.matched['VOLUME-PAGINATION'] = pattern.toString();        

      citation.volume = result[1];
      citation.issue = result[2];
      citation.spage = result[3];
      citation.page = citation.spage;
      if (result[4]) {
        citation.epage = result[4];
        citation.page += '-' + citation.epage;
      }
    }
  }    
  
  // linked journal
  // '']] (50): 93–96.
  if (citation.parts['VOLUME-PAGINATION'].length == 0) {
    pattern = /''\]\]\s*\((\d+)\):\s*(\d+)([-|–](\d+))?/;
    result = string.match(pattern);

    if (result) {
      console.log(JSON.stringify(result));

      citation.parts['VOLUME-PAGINATION'].push(result[0]);
      
      citation.matched['VOLUME-PAGINATION'] = pattern.toString();        

      citation.volume = result[1];
      citation.spage = result[2];
      citation.page = citation.spage;
      if (result[3]) {
        citation.epage = result[3];
        citation.page += '-' + citation.epage;
      }
    }
  }  

  // italic journal, volume and issue in bold
  if (citation.parts['VOLUME-PAGINATION'].length == 0) {
    pattern = /''([^'][^']+)''\s+'''(\d+)\s*\((.*)\)''':\s*(\d+)([-|–](\d+))?/;
    result = string.match(pattern);

    if (result) {
      console.log(JSON.stringify(result));

      citation.parts['JOURNAL'].push(result[1]);
      citation.parts['VOLUME-PAGINATION'].push(result[0]);
      
      citation.matched['VOLUME-PAGINATION'] = pattern.toString();       

      citation.journal = result[1];
      citation.volume = result[2];
      citation.issue = result[3];
      citation.spage = result[4];
      citation.page = citation.spage;
      if (result[6]) {
        citation.epage = result[6];
        citation.page += '-' + citation.epage;
      }
    }
  }
  
  // italic journal
  // https://species.wikimedia.org/w/index.php?title=Songthela&action=edit&section=4
  // '' (A), (33): 145–151.
  if (citation.parts['VOLUME-PAGINATION'].length == 0) {
    pattern = /''([^'][^']+)''\s+\(([A-Z])\),?\s+\(?(\d+)\)?:\s*(\d+)([-|–](\d+))?/;
    result = string.match(pattern);

    if (result) {
      console.log(JSON.stringify(result));

      citation.parts['JOURNAL'].push(result[1]);
      citation.parts['VOLUME-PAGINATION'].push(result[0]);
      
      citation.matched['VOLUME-PAGINATION'] = pattern.toString();       

      citation.journal = result[1];
      citation.series = result[2];
      citation.journal += ' ' + citation.series;
      citation.volume = result[3];
      citation.spage = result[4];
      citation.page = citation.spage;
      if (result[6]) {
        citation.epage = result[6];
        citation.page += '-' + citation.epage;
      }
    }
  }  
  
  // italic journal, No. prefix
  // '' No. 2978: 1–42.
  if (citation.parts['VOLUME-PAGINATION'].length == 0) {
    pattern = /''([^'][^']+)''\s+No\.\s+\(?(\d+)\)?:\s*(\d+)([-|–](\d+))?/;
    result = string.match(pattern);

    if (result) {
      console.log(JSON.stringify(result));

      citation.parts['VOLUME-PAGINATION'].push(result[0]);
      
      citation.matched['VOLUME-PAGINATION'] = pattern.toString();       

      citation.journal = result[1];
      citation.volume = result[2];
      citation.spage = result[3];
      citation.page = citation.spage;
      if (result[5]) {
        citation.epage = result[5];
        citation.page += '-' + citation.epage;
      }
    }
  }  
  
  // italic journal, series and volume, optina issue, not bold
  // '', (5) 3: 109–116.
  if (citation.parts['VOLUME-PAGINATION'].length == 0) {
    pattern = /'([^'][^']+)'',?\s+\((\d+)\)\s+(\d+)(\s*\((.*)\))?:\s*(\d+)([-|–](\d+))?/;    
    result = string.match(pattern);

    if (result) {
      console.log(JSON.stringify(result));

      citation.parts['JOURNAL'].push(result[1]);
      citation.parts['VOLUME-PAGINATION'].push(result[0]);
      
      citation.matched['VOLUME-PAGINATION'] = pattern.toString();   

      citation.journal = result[1];
      citation.series = result[2];
      citation.journal += ' series ' + citation.series;
      citation.volume = result[3];
      
      if (result[5]) {
        citation.issue = result[5];
      }      

      citation.spage = result[6];
      citation.page = citation.spage;
      if (result[8]) {
        citation.epage = result[8];
        citation.page += '-' + citation.epage;
      }
      //emit(i, result[i]);
    }
  }  
  
 // italic journal, volume and issue  bold
  if (citation.parts['VOLUME-PAGINATION'].length == 0) {
    pattern = /'([^'][^']+)'',?\s+'''(\d+)\((.*)\)''':\s*(\d+)([-|–](\d+))?/;    
    result = string.match(pattern);

    if (result) {
      console.log(JSON.stringify(result));

      citation.parts['JOURNAL'].push(result[1]);
      citation.parts['VOLUME-PAGINATION'].push(result[0]);
      
      citation.matched['VOLUME-PAGINATION'] = pattern.toString();   

      citation.journal = result[1];
      citation.volume = result[2];
      citation.issue = result[3];

      citation.spage = result[4];
      citation.page = citation.spage;
      if (result[6]) {
        citation.epage = result[6];
        citation.page += '-' + citation.epage;
      }
      //emit(i, result[i]);
    }
  }

// pages in BHL
  if (citation.parts['VOLUME-PAGINATION'].length == 0) {
    pattern = /'([^'][^']+)'',?\s+'''(\d+)''':\s*\[(http:\/\/(www.)?biodiversitylibrary(.*))\s+(\d+)\]/;    
    result = string.match(pattern);

    if (result) {
      console.log(JSON.stringify(result));

      citation.parts['JOURNAL'].push(result[1]);
      citation.parts['VOLUME-PAGINATION'].push(result[0]);
      
      citation.matched['VOLUME-PAGINATION'] = pattern.toString();   

      citation.journal = result[1];
      citation.volume = result[2];
      
      citation.BHL = result[3];

      citation.spage = result[6];
      citation.page = citation.spage;
      
      //emit(i, result[i]);
    }
  }

  // ]] (Munich) v. 11 (no. 1): 69–93.
  if (citation.parts['VOLUME-PAGINATION'].length == 0) {
    pattern = /\]\]\s+(?:.*)v(?:ol)?\.\s*(\d+)\s*\((?:no\.\s*)?(.*)\):\s*(\d+)([-|–](\d+))?/;   
    result = string.match(pattern);

    if (result) {
      console.log(JSON.stringify(result));

      citation.parts['VOLUME-PAGINATION'].push(result[0]);
      citation.matched['VOLUME-PAGINATION'] = pattern.toString();   

      citation.volume = result[1];
      citation.issue = result[2];

      citation.spage = result[3];
      citation.page = citation.spage;
      if (result[5]) {
        citation.epage = result[5];
        citation.page += '-' + citation.epage;
      }
    }
  }   

  // journal
  if (citation.parts['JOURNAL'].length == 0) {
    pattern = /''([^'][^']+)''[\.|,]?((\s+\w+)+)?\s*('''(\d+)'''(\((.*)\))?:\s*(\d+)[-|–](\d+))/;

    result = string.match(pattern);
    //for (var i in result) {
    if (result) {

      citation.parts['JOURNAL'].push(result[1]);
      citation.parts['VOLUME-PAGINATION'].push(result[4]);
      
      citation.matched['JOURNAL'] = pattern.toString();            

      citation.journal = result[1];
      citation.volume = result[5];
      if (result[7]) {
        citation.issue = result[7];
      }

      citation.spage = result[8];
      citation.page = citation.spage;
      if (result[9]) {
        citation.epage = result[9];
        citation.page += '-' + citation.epage;
      }
    }
  }
  
  // journal
  // ''Verslagen en Mededeelingen der Koninklijke Akademie van Wetenschappen. Afdeeling Natuurkunde'' (2), '''8''': 372–376
  if (citation.parts['JOURNAL'].length == 0) {
    pattern = /''([^'][^']+)''[\.|,]?\s*\((\d+)\),?\s*('''(\d+)'''(\((.*)\))?:\s*(\d+)[-|–](\d+))/;

    result = string.match(pattern);
    if (result) {

      citation.parts['JOURNAL'].push(result[1]);
      citation.parts['VOLUME-PAGINATION'].push(result[4]);
      
      citation.matched['JOURNAL'] = pattern.toString();            

      citation.journal = result[1];
      citation.series = result[2];
      citation.journal += ' series ' + citation.series;
      citation.volume = result[4];

      citation.spage = result[7];
      citation.page = citation.spage;
      if (result[8]) {
        citation.epage = result[8];
        citation.page += '-' + citation.epage;
      }
    }
  }

  // journal
  if (citation.parts['JOURNAL'].length == 0) {
    pattern = /''([^'][^']+)''[\.|,]?\s*\((.*)\)\s*('''(\d+)''':\s*(\d+)[-|–](\d+))/;

    result = string.match(pattern);
    //for (var i in result) {
    if (result) {

      citation.parts['JOURNAL'].push(result[1]);
      citation.parts['VOLUME-PAGINATION'].push(result[3]);
      
      citation.matched['JOURNAL'] = pattern.toString();      

      citation.journal = result[1];

      // non-standard CSL
      citation.series = result[2];
      citation.journal += ' series ' + citation.series;

      citation.volume = result[4];
      citation.spage = result[5];
      citation.page = citation.spage;
      if (result[6]) {
        citation.epage = result[6];
        citation.page += '-' + citation.epage;
      }
      //emit(i, result[i]);
    }
  }

  // journal
  if (citation.parts['JOURNAL'].length == 0) {
   pattern = /''(.*)''[\.|,]?\s+('''(\d+)''':\s*(\d+)[-|–](\d+))/;
   result = string.match(pattern);
    //for (var i in result) {
    if (result) {

      citation.parts['JOURNAL'].push(result[1]);
      citation.parts['VOLUME-PAGINATION'].push(result[3]);
      
      citation.matched['JOURNAL'] = pattern.toString();

      citation.journal = result[1];
      citation.volume = result[3];
      citation.spage = result[4];
      citation.page = citation.spage;
      if (result[5]) {
        citation.epage = result[5];
        citation.page += '-' + citation.epage;
      }
      //emit(i, result[i]);
    }
  }

  
  // journal
  // * {{aut|Thomas, O.}} 1904. On mammals from northern Angola collected by Dr. W. J. Ansorge. ''Annals and Magazine of Natural History'' ser 7, 13: 405–421.
  if (citation.parts['JOURNAL'].length == 0) {
    pattern = /''(.*)''[\.|,]?\s+ser\.?\s+(\d+),?\s+((\d+):\s*(\d+)[-|–](\d+))/;
    result = string.match(pattern);
    //for (var i in result) {
    if (result) {

      citation.parts['JOURNAL'].push(result[1]);
      citation.parts['VOLUME-PAGINATION'].push(result[4]);
      
      citation.matched['JOURNAL'] = pattern.toString();      

      citation.journal = result[1];

      if (result[2]) {
        citation.series = result[2];
        citation.journal += ' series ' + citation.series;
      }

      citation.volume = result[4];
      citation.spage = result[5];
      citation.page = citation.spage;
      if (result[6]) {
        citation.epage = result[6];
        citation.page += '-' + citation.epage;
      }
      //emit(i, result[i]);
    }
  }

  // Journal with ISSN
  if (citation.parts['JOURNAL'].length == 0) {
    pattern = /\[\[ISSN ([0-9]{4}-[0-9]{3}([0-9]|X))\|(?:\'\')(.*)(?:\'\')]\]/;
    result = string.match(pattern);
    //for (var i in result) {
    if (result) {
      citation.parts['JOURNAL'].push(result[0]);
      
      citation.matched['JOURNAL'] = pattern.toString();
      
      citation.ISSN = [result[1]];
      citation.journal = result[3];
   }
  }

  if (citation.parts['JOURNAL'].length == 0) {
    pattern = /(?:\'\')\[\[ISSN ([0-9]{4}-[0-9]{3}([0-9]|X))\|(.*)\]\](?:\'\')/;
    result = string.match(pattern);
    //for (var i in result) {
    if (result) {
      citation.parts['JOURNAL'].push(result[0]);
      
      citation.matched['JOURNAL'] = pattern.toString();
      
      citation.ISSN = [result[1]];
      citation.journal = result[3];
    }
  }
  
  // journal
  // simple journal in italics with volume not in bold
  // e.g. ''Proceedings of the Zoological Society of London'' 1896: 1012–1028.
  // ''Journal of Herpetology'' 36 (2): 292–295.
  if (citation.parts['JOURNAL'].length == 0) {
    pattern = /''([^'][^']+)''[\.|,]?\s+((\d+)\s*(\((.*)\))?:\s*(\d+)[-|–](\d+))/;
    result = string.match(pattern);
    //for (var i in result) {
    if (result) {

      citation.parts['JOURNAL'].push(result[1]);
      citation.parts['VOLUME-PAGINATION'].push(result[3]);
                      
      citation.matched['JOURNAL'] = pattern.toString();

      citation.journal = result[1];
      citation.volume = result[3];
      
      if (result[5]) {
        citation.issue = result[5];
      }      
      
      citation.spage = result[6];
      citation.page = citation.spage;
      if (result[7]) {
        citation.epage = result[7];
        citation.page += '-' + citation.epage;
      }
      //emit(i, result[i]);
    }
  }  
  
  // templates (authors, identifiers, etc.)
  result = matchRecursive(string, "{{...}}");
  for (var i in result) {
    console.log(result[i]);
    
    // DOI
    if (match = result[i].match(/doi\|(.*)/)) {
      citation.DOI = match[1];
    }
    
    // ISBN
    if (match = result[i].match(/ISBN\|(.*)/i)) {
      citation.ISBN = match[1];
      citation.ISBN = citation.ISBN.replace(/-/g, '');
    }    

    if (match = result[i].match(/^a\|(.*)\|(.*)/)) {
      var name = {};
      name.literal = match[2];
      name.WIKISPECIES = match[1];
      
      citation.author.push(name);

      citation.parts['AUTHOR'].push(match[0]);
    }

    if (match = result[i].match(/aut\|(.*)/)) {
      var name = {};

      var link = parse_link(match[1]);
      if (link.name) {
        name.literal = link.name;
        name.WIKISPECIES = link.link;
      } else {
        name.literal = match[1];
      }

      citation.author.push(name);
      citation.parts['AUTHOR'].push(match[0]);
      console.log(match[1]);
    }

    if (match = result[i].match(/auth\|(.*)\|(.*)\|[r|s]/)) {
      var name = {};
      name.given = match[1];
      name.family = match[2];
      citation.author.push(name);
      citation.parts['AUTHOR'].push(match[0]);
      console.log(match[1]);
    }

    if (match = result[i].match(/zootaxa\|(.*)$/i)) {
      //alert('zootaxa');
      console.log("match=" + JSON.stringify(match));
      citation = parse_zootaxa(match[0], citation);
    }

    if (match = result[i].match(/AEMNP\|(.*)$/)) {
      //alert('zootaxa');
      console.log("match=" + JSON.stringify(match));
      citation = parse_aemnp(match[0], citation);
    }

  }

  // doi:
  pattern = /doi:(10\.\d{4,5}\/([a-z]|[0-9]|\[|\]|<|>|;|-|\(|\)){2,30})\b/;
  result = string.match(pattern);
  if (result) {
    citation.DOI = result[1];
    citation.parts['DOI'] = result[0];
    citation.matched['DOI'] = pattern.toString();
    console.log(result[1]);
  }

  // year
  pattern = /\}\}[,|\.|;]?\s+[\(]?([0-9]{4})[\)]?/;
  result = string.match(pattern);
  if (result) {
    citation.year = result[1];
    citation.parts['YEAR'] = result[0];
    citation.matched['YEAR'] = pattern.toString();
    console.log(result[1]);
  }
  
  // title linked to reference
  if (!citation.parts.TITLE && citation.parts.YEAR && citation.parts['JOURNAL'].length > 0) {
    // https://stackoverflow.com/a/3809435/9684
    var url_pattern = 'https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%_\\+.~#?&//=]{2,256}\\.[a-z]{2,4}\\b(\\/[-a-zA-Z0-9@:%_\\+.~#?&//=]*)?';
    var pattern = escape_pattern(citation.parts.YEAR)
      +
      ':?\\s*(\\[(' + url_pattern + ')\\s+(.*)\\]\\.?)\\s+(\'\')?' +
      escape_pattern(citation.parts['JOURNAL'][0]);
    
    //alert(pattern);

    result = string.match(pattern);
    if (result) {
      citation.parts.TITLE = result[3];
      citation.parts['TITLE'] = result[1];
      citation.matched['TITLE'] = pattern.toString();

      
      citation.title = result[5];
      
      var url = result[2];
      if (url.match(/\.pdf$/)) {
        citation.PDF = url;
      } else {
        citation.URL = url;
      }
    }
  }  

  if (!citation.parts.TITLE && citation.parts.YEAR && citation.parts['JOURNAL'].length > 0) {
    var pattern = escape_pattern(citation.parts.YEAR)
      +
      '[a-z]?(?:\\d)?(?:\\([0-9]{4}\\))?[\.|:]?\\s+(.*)\\s+' +
      '(?:\'\')?' +
      escape_pattern(citation.parts['JOURNAL'][0]);

    result = string.match(pattern);
    if (result) {
      citation.title = result[1];
    }
  }
  
  
  // BHL
  // [http://biodiversitylibrary.org/page/5508233 BHL]
  pattern = /\[(http:\/\/(www.)?biodiversitylibrary(.*))\s+BHL\]/;
  result = string.match(pattern);
  if (result) {
    citation.BHL = result[1];
    citation.parts['BHL'] = result[0];
    citation.matched['BHL'] = pattern.toString();
     console.log(result[1]);
  } 
  
  
  // CiNii
  pattern = /\[http:\/\/ci.nii.ac.jp\/naid\/(\d+)[\/]?/;
  result = string.match(pattern);
  if (result) {
    citation.CINII = result[1];
    citation.parts['CINII'] = result[0];
    citation.matched['CINII'] = pattern.toString();
    console.log(result[1]);
  }  
  
  // Handle
  // [http://digitallibrary.amnh.org/dspace/handle/2246/5065 Handle.]
  pattern = /\[http:\/\/(?:.*)\/(\d+\/\d+)\s+(Handle\.)?(\(Abstract\))?/i;
  result = string.match(pattern);
  if (result) {
    citation.HANDLE = result[1];
    citation.parts['HANDLE'] = result[0];
    citation.matched['HANDLE'] = pattern.toString();
    console.log(result[1]);
  }  
  
  // JSTOR
  // [http://www.jstor.org/stable/41738606 JSTOR]
  pattern = /\[http:\/\/www.jstor.org\/stable\/(\d+)\s+JSTOR\]/;
  result = string.match(pattern);
  if (result) {
    citation.JSTOR = result[1];
    citation.parts['JSTOR'] = result[0];
    citation.matched['JSTOR'] = pattern.toString();
    console.log(result[1]);
  } 
  
  // PDF
  // [http://mapress.com/zootaxa/2011/f/zt03035p068.pdf PDF]]
  pattern = /\[(http:\/\/(.*)\.pdf)\s+(Full|PDF|Preview|Abstract)/i;
  result = string.match(pattern);
  if (result) {
    citation.PDF = result[1];
    citation.parts['PDF'] = result[0];
    citation.matched['PDF'] = pattern.toString();
    console.log(result[1]);
  }  
 
  // Wikispecies link
  pattern = /\[http:\/\/species.wikimedia.org\/wiki\/(Template:.*)\s*Reference page\.?\]/i;
  result = string.match(pattern);
  if (result) {
    citation.WIKISPECIES = result[1];
    citation.WIKISPECIES = citation.WIKISPECIES.replace(/\s+$/, '');
    citation.parts['WIKISPECIES'] = result[0];
    citation.matched['WIKISPECIES'] = pattern.toString();
    console.log(result[1]);
  }    
  
  // ZooBank
  // {{ZooBankRef|BB30465E-865B-4938-98B1-378EF64F31E3}}
  pattern = /\{\{ZooBankRef\|(.*)\}\}/i;
  result = string.match(pattern);
  if (result) {
    citation.ZOOBANK = result[1];
    citation.parts['ZOOBANK'] = result[0];
    citation.matched['ZOOBANK'] = pattern.toString();
    console.log(result[1]);
  } 
  
  // cleanup

  if (citation.title) {
    //citation.title.replace(/\s''/g, ' <i>');
    //citation.title.replace(/\\'\\'(\b)/g, '</i>$1');

    //r = citation.title.match(/([\s|,|\.])''/g);
    //if (r) { alert(JSON.stringify(r)); }
    
    
    // remove embedded links to taxon authors
    var result = matchRecursive(citation.title, "{{...}}");
    for (var i in result) {
      console.log(result[i]);
    
      var matched = false;
      var match = null;
      var pattern = '';

      // {{aut|Spix}}
      if (!matched) {
        if (match = result[i].match(/^aut\|(.*)/)) {
          pattern = "{{" + match[0] + "}}";
          pattern = pattern.replace(/\|/g, "\|");
          var author_name = match[1];
          
          // remove from title string
          citation.title = citation.title.replace(pattern, author_name);
          
          // remove from list of authors
          if (citation.author) {
            var i = 0;
            var j = -1;
            while ((i < citation.author.length) && (j == -1)) {
              if (citation.author[i].literal == author_name) {
                j = i;
              }
              i++;
            }
            
            if (j != -1) {
              citation.author.splice(j, 1);
            }
          }
          matched = true;
        }
      }    
    }

    // italics
    citation.title = citation.title.replace(/([\s|,|\.|\(])''/g, '$1<i>');
    citation.title = citation.title.replace(/^''/g, '<i>');
    citation.title = citation.title.replace(/''([\s|,|\.|:|\)])/g, '</i>$1');
    citation.title = citation.title.replace(/''$/g, '</i>');
    citation.title = citation.title.replace(/\.\s*$/g, '');
    citation.title = citation.title.replace(/&quot;/, "'");
  }
  
  if (citation.epage) {
    citation.epage = citation.epage.replace(/^–/, '');
  } 
                                            
  if (citation.page) {
    citation.page = citation.page.replace(/-–/, '-');
  }   
  
  if (citation.journal) {
    citation.journal = citation.journal.replace(/&quot;/, "'");
  }  
  if (citation['container-title']) {
    citation['container-title'] = citation['container-title'].replace(/&quot;/, "'");
  }    

  // horrible hack to handle regexp being greedy
  // For example, * {{aut|Maruyama, M.}}; {{aut|Ueno, T.}} & {{aut|Sakchoowong, W.}} 2011: [http://hdl.handle.net/2324/19401 ''Coenochilus thailandicus'' (Coleoptera, Scarabaeidae, Cetoniinae), a new species of Cremastocheilini from Thailand.] [[ISSN 0071-1268|''Esakia'']] (50): 93–96. [http://2745485482607761905-a-1802744773732722657-s-sites.googlegroups.com/site/myrmekophilos/paper/10_MARUYAMA_etal_Coenochilus.pdf PDF]
  if (citation.PDF) {
    pattern = /\[(http:\/\/(.*)\.pdf)/;
    result = citation.PDF.match(pattern);
    if (result) {
      citation.PDF = result[1];
    }      
  }    

  
  

  if (!debug) {
    delete citation.parts;
    delete citation.matched;
  }

  // citeproc conversion
  if (citation.year) {
    citation.issued = {};
    citation.issued['date-parts'] = [];
    citation.issued['date-parts'].push([parseInt(citation.year)]);
    
    delete citation.year;

  }
  if (citation.journal) {
    citation['container-title'] = citation.journal;
    //citation.type = "journal-article";
    citation.type = "article-journal";
    delete citation.journal;
  }
  
  if (citation.spage) {
    delete citation.spage;
  }
  if (citation.epage) {
    delete citation.epage;
  }
  
  // store various identifiers
  if (citation.CINII) {
    citation['alternative-id'].push(citation.CINII);
  }   
  if (citation.DOI) {
    citation['alternative-id'].push(citation.DOI.toLowerCase());
  }
  if (citation.HANDLE) {
    citation['alternative-id'].push(citation.HANDLE.toLowerCase());
  }
  if (citation.WIKISPECIES) {
    citation['alternative-id'].push(citation.WIKISPECIES);
  }  
  if (citation.ZOOBANK) {
    citation['alternative-id'].push(citation.ZOOBANK.toLowerCase());
  }
  
  
  if (citation['alternative-id'].length == 0) {
    delete citation['alternative-id'];
  }

  // did we parse the citation?
  if (citation.status == 'not parsed') {

    // did we get author, title, volume, and page?
    if (citation.author
       && citation.title
       && citation['container-title']
       && citation.volume
       && citation.page ) {
      citation.status = 'ok';
    }
  }
  

  return citation;
}

function format_citation(citation) {

  citation.id = "ITEM-1";
  
  bibdata = {};
  bibdata["ITEM-1"] = citation;

  // This defines the mechanism by which we get hold of the relevant data for
  // the locale and the bibliography. 
  // 
  // In this case, they are pretty trivial, just returning the data which is
  // embedded above. In practice, this might involving retrieving the data from
  // a standard URL, for instance. 
  var sys = {
    retrieveItem: function(id) {
      return bibdata[id];
    },

    retrieveLocale: function(lang) {
      return locale[lang];
    }
  }

  // instantiate the citeproc object
  var citeproc = new CSL.Engine(sys, chicago_author_date);

  // This is the citation object. Here, we have hard-coded this, so it will only
  // work with the correct HTML. 
  var citation_object = {
    // items that are in a citation that we want to add. in this case,
    // there is only one citation object, and we know where it is in
    // advance. 
    "citationItems": [{
      "id": "ITEM-1"
    }],
    // properties -- count up from 0
    "properties": {
      "noteIndex": 0
    }

  }

  citeproc.appendCitationCluster(citation_object)[0][1];

  $('#csl').html(citeproc.makeBibliography()[1][0]);

}

  function run_tests () {
  
    var html = '';
    html += '<table>';  
    
	var keys = ['author', 'title', 'container-title', 'volume', 'issue', 'page', 'year', 'DOI', 'CINII', 'HANDLE', 'WIKISPECIES'];
	
	var tests = [];
	
	// a test
	tests.push({
	  input : "* {{aut|Bleeker, P.}} 1851. Visschen van Billiton. ''Natuurkundig Tijdschrift voor Nederlandsch Indië'' 1: 478–479.",
	  output : {
"author": [
{
  "literal": "Bleeker, P."
}
],
"journal": "Natuurkundig Tijdschrift voor Nederlandsch Indië",
"volume": "1",
"spage": "478",
"page": "478-479",
"epage": "479",
"year": "1851",
"title": "Visschen van Billiton",
"issued": {
"date-parts": [
  [
	"1851"
  ]
]
},
"container-title": "Natuurkundig Tijdschrift voor Nederlandsch Indië",
"id": "ITEM-1",
"type": "article-journal"
}
	});
    
  tests.push({
    input : "* {{aut|[[František Moravec|Moravec, F.]]}} & {{aut|[[Kazuya Nagasawa|Nagasawa, K.]]}} (2002) Redescription of ''Raphidascaris gigi'' Fujita, 1928 (Nematoda: Anisakidae), a parasite of freshwater fishes in Japan. ''Systematic Parasitology'' 52: 193–198. {{doi|10.1023/a:1015785602488}}",
    output : {
  "author": [
    {
      "literal": "František Moravec",
      "WIKISPECIES": "Moravec, F."
    },
    {
      "literal": "Kazuya Nagasawa",
      "WIKISPECIES": "Nagasawa, K."
    }
  ],
  "journal": "Systematic Parasitology",
  "volume": "52",
  "spage": "193",
  "page": "193-198",
  "epage": "198",
  "DOI": "10.1023/a:1015785602488",
  "year": "2002",
  "title": "Redescription of Raphidascaris gigi Fujita, 1928 (Nematoda: Anisakidae), a parasite of freshwater fishes in Japan",
  "issued": {
    "date-parts": [
      [
        "2002"
      ]
    ]
  },
  "container-title": "Systematic Parasitology",
  "id": "ITEM-1",
  "type": "article-journal"
}
    
  });
    
  tests.push({
    input : "* {{a|Norman I. Platnick|Platnick, N.I.}} 1990. Spinneret Morphology and the Phylogeny of Ground Spiders (Araneae, Gnaphosoidea). ''[[ISSN 0003-0082|American Museum Novitates]]'' No. 2978: 1–42. [http://digitallibrary.amnh.org/dspace/handle/2246/5065 Handle.]",
    output : {
  "author": [
    {
      "literal": "Norman I. Platnick",
      "family": "",
      "given": ""
    }
  ],
  "journal": "American Museum Novitates",
  "volume": "2978",
  "spage": "1",
  "page": "1-42",
  "epage": "42",
  "issn": [
    "0003-0082"
  ],
  "year": "1990",
  "title": "Spinneret Morphology and the Phylogeny of Ground Spiders (Araneae, Gnaphosoidea)",
  "HANDLE": "2246/5065",
  "issued": {
    "year": 1990
  },
  "container-title": "American Museum Novitates",
  "id": "ITEM-1",
  "type": "article-journal",
  "page-first": "1"
}
  });

    
    
    	
  //-------------------------------------------------------------------------
	// parse the test cases
	var parsing_results = [];	
	for (var i in tests) {
		parsing_results[i] = parse_reference(tests[i].input);
	}
	
	// make comparison
	for (var i in tests) {
		var ok = true;
    
    
	
		for (var k in keys) {
			var key = keys[k];
			var test_value = tests[i][keys[k]];
			
			if (test_value) {
				if (typeof test_value === 'object') {
					test_value = JSON.stringify(test_value);
				}
				
				if (parsing_results[i][key]) {
					var parsed_value = parsing_results[i][key];
					if (typeof parsed_value === 'object') {
						parsed_value = JSON.stringify(parsed_value);
					}  
					
					if (test_value != parsed_value) {
						ok = false; // values are different, so objects are not the same
					}
				} else {
					ok = false; // parsed result doesn't have this key, so objects are different
				}
			}
		}
    
    html += '<tr'; 
    
    if (ok) {
      html += ' style="background-color:green;color:white;"';
    } else {
      html += ' style="background-color:red;color:white;"';      
    }
    html += '>';
    html += '<td>'; 
    html += i + '  ' + tests[i].input;
    html += '</td>';      
    
    html += '<td>';  
		if (ok) {
      html += "passed";
		} else {
      html += "failed";
		}  
    html += '</td>';    
    html += '</tr>';
	}
    
    html += '</table>';
    
    $('#tests').html(html);
}

Parser.prototype.parse_reference = function(string) { 
  return parse_reference(string); 
}

module.exports = Parser;