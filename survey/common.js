/* Shared survey sections used by both the CHEM 3A and CHEM 1A end-of-semester surveys. */
window.SURVEY_COMMON = {
  agree: ['Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree'],
  fcc: {
    title: 'The FCC course survey questions',
    intro: 'These come from the Student Course Surveys Fresno City College uses when faculty are evaluated. This isn’t an evaluation semester for me, so your answers here are pure feedback to help me grow.',
    items: [{
      type: 'scale', id: 'fcc', na: false,
      q: 'How much do you agree with each statement?',
      labels: ['Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree'],
      rows: [
        'The instructor appears to be well informed about the course subject matter.',
        'The instructor’s knowledge of the subject matter was communicated effectively to the students.',
        'The instructor takes the time to explain when students do not understand the material.',
        'The grading system for the course has been clearly explained and stated in the syllabus.',
        'The materials required for the course are relevant and utilized in this course.',
        'In and out of class assignments are helpful and useful in understanding the concepts or acquiring the skills being studied in this course.',
        'The instructor returns assignments in time for the evaluation (grades, comments, etc.) to be beneficial.',
        'Assignments and tests are relevant to the material covered in class.',
        'The instructor provides the students with beneficial feedback regarding assignments (projects, papers, labs, etc.).',
        'The instructor creates and maintains an environment of respect for students and the college.'
      ]
    }]
  },
  etc: function (leader, course) {
    return {
      title: 'ETC with ' + leader,
      intro: 'I love hearing how our ETC leader did. Your answers may be shared with ' + leader + ' (never with your name, since this survey doesn’t collect it) so they can keep growing too.',
      items: [
        { type: 'single', id: 'etc_attend', q: 'How often did you go to ETC sessions with ' + leader + '?',
          options: ['Never', 'Once or twice', 'A few times', 'Most weeks', 'Every week'] },
        { type: 'single', id: 'etc_whynot', q: 'If you rarely or never went, what got in the way?',
          options: ['The times didn’t work with my schedule', 'I didn’t know when or where it was', 'I didn’t think I needed it', 'I used other help instead (office hours, tutoring, videos)', 'Other'], other: 'Something else? (optional)' },
        { type: 'scale', id: 'etc_rate', q: 'If you went: how much do you agree?', labels: window.SURVEY_COMMON_AGREE,
          rows: [leader + ' explained things clearly.', leader + '’s sessions helped me on skill checks and exams.', leader + ' was approachable and easy to ask questions.', leader + '’s sessions were organized and a good use of my time.', 'I would recommend ETC with ' + leader + ' to future ' + course + ' students.'] },
        { type: 'text', id: 'etc_good', q: 'What did ' + leader + ' do really well?' },
        { type: 'text', id: 'etc_better', q: 'What could ' + leader + ' (or ETC in general) do better?' }
      ]
    };
  },
  overall: function (course, extraRows) {
    return {
      title: 'Overall',
      items: [{
        type: 'scale', id: 'overall', na: false,
        q: 'Rate each one from 1 to 5.',
        labels: ['1', '2', '3', '4', '5'],
        legend: '1 = Absolutely not / very easy, 5 = Absolutely yes / very hard (for difficulty).',
        rows: ['How difficult was this class?', 'Do you like chemistry more than when you started?', 'What do you think of Dr. Dan as a teacher?', 'Would you recommend Dr. Dan to others as a ' + course + ' professor?', 'Was the Canvas page easy to navigate and find things?', 'Were the mini-lecture videos helpful?'].concat(extraRows || [])
      }]
    };
  },
  words: function (course) {
    return {
      title: 'In your own words',
      intro: 'Now is your chance to give me your honest opinion. Remember, this is anonymous: compliments and criticism both help me improve.',
      items: [
        { type: 'text', id: 'change', q: 'Is there anything you would recommend changing or continuing to do in ' + course + '?', hint: 'This could be something another professor did that really helped you, or something you wish your professors would do to help you learn and succeed.' },
        { type: 'text', id: 'drdan', q: 'Any opinions or feedback on Dr. Dan as a teacher?', hint: 'Anything I did well, or didn’t do well that you wish I had? Anything that sets me apart from other faculty, in a good or bad way?' },
        { type: 'text', id: 'else', q: 'Anything else you want me to know?' }
      ]
    };
  },
  thanks: '<p>As always, it was an absolute pleasure to have you in my class. I hope you hate chemistry a little less… or maybe you really like chemistry now and just wish it wasn’t so hard.</p>' +
    '<p>If you ever need anything in your academic journey, <b>please reach out</b>: a letter of recommendation, someone to listen to you stress about school or life, anything. I am here for you at FCC. My email is <a href="mailto:Daniel.kwasniewski@fresnocitycollege.edu">Daniel.kwasniewski@fresnocitycollege.edu</a>.</p>' +
    '<p>I hope to see you again on campus, and I wish you the best of luck achieving your dreams. Thank you for making me a part of your journey. — Dr. Dan</p>'
};
window.SURVEY_COMMON_AGREE = window.SURVEY_COMMON.agree;
